#!/usr/bin/env node
// Snapshot the multisite's public subsites and their latest "Action" posts
// into committed JSON. Mirrors the songs snapshot pattern: the WP origin is
// bot-blocked from CF Pages build workers (Imunify360), so the build reads
// committed JSON instead of hitting WP at deploy time.
//
// Run locally where the WP origin doesn't bot-block your IP:
//   node scripts/snapshot-subsites.mjs
//
// Outputs:
//   data/subsites.json   array of { id, slug, name, url } (matches /wp-json/irg/v1/subsites)
//   data/actions.json    array of Action records sorted by date desc
//
// Re-run any time a gaggle subsite is added, renamed, or publishes new posts.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return { ...env, ...process.env };
}

const env = loadEnv();
const WP_URL = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
if (!WP_URL) {
  console.error("Missing PUBLIC_WP_URL (set in .env.local)");
  process.exit(1);
}

// Per-subsite cap. Far more than the homepage shows, so the snapshot stays
// useful for archive/listing work without re-running.
const POSTS_PER_SUBSITE = 25;

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Accept": "application/json",
  "User-Agent": "irg-build/1.0 (+https://raginggrannies.org)",
};

async function fetchSubsites() {
  const url = `${WP_URL}/wp-json/irg/v1/subsites`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`subsites endpoint ${res.status} ${res.statusText}`);
  const body = await res.json();
  if (!Array.isArray(body)) {
    throw new Error(`subsites endpoint returned non-array: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body
    .filter((s) => s && s.slug)
    .map((s) => ({
      id: Number(s.id),
      slug: String(s.slug),
      name: String(s.name || s.slug),
      url: String(s.url || `${WP_URL}/${s.slug}`).replace(/\/$/, ""),
    }));
}

async function fetchActionsForSubsite(site) {
  const endpoint = `${site.url}/graphql`;
  const query = `{
    posts(first: ${POSTS_PER_SUBSITE}, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        title slug date excerpt link
        categories { nodes { slug } }
      }
    }
  }`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  if (!json.data?.posts) {
    throw new Error(`missing data.posts — got: ${JSON.stringify(json).slice(0, 200)}`);
  }
  // "Calgary Raging Grannies" -> "Calgary"; matches the live actions.ts logic.
  const gaggle = site.name.replace(/\s+Raging\s+Grannies\s*$/i, "").trim() || site.name;
  return json.data.posts.nodes
    // Exclude the seeder's welcome placeholder. It's intentionally left on
    // each new subsite so the /actions/ page isn't empty, but the
    // international hub's Recent Actions feed shouldn't carry 60 copies of
    // the same post. WP auto-suffixes ("-2") if a granny ever writes a real
    // post by the same title, so this exact-slug match is safe.
    .filter((p) => p.slug !== "welcome-to-our-corner-of-the-movement")
    // Exclude posts in the Gaggle Notes category — those are reference
    // material (FAQs, guidelines, pledges) that get their own surface on
    // the gaggle subsite home page and shouldn't show in the cross-site
    // Recent Actions aggregator.
    .filter((p) => !(p.categories?.nodes ?? []).some((c) => c.slug === "gaggle-notes"))
    .map((p) => ({
      title: p.title ?? "",
      slug: p.slug ?? "",
      date: p.date ?? "",
      excerpt: p.excerpt ?? "",
      link: p.link ?? "",
      gaggle,
      gaggleSlug: site.slug,
    }));
}

(async () => {
  console.log(`[snapshot] querying ${WP_URL}/wp-json/irg/v1/subsites`);
  const subsites = await fetchSubsites();
  console.log(`[snapshot] received ${subsites.length} subsites`);

  const allActions = [];
  for (const site of subsites) {
    try {
      const posts = await fetchActionsForSubsite(site);
      console.log(`  ${site.slug.padEnd(20)} ${posts.length} posts`);
      allActions.push(...posts);
    } catch (err) {
      console.warn(`  ${site.slug.padEnd(20)} FAILED: ${err.message}`);
    }
  }

  allActions.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const subsitesPath = resolve(ROOT, "data/subsites.json");
  const actionsPath = resolve(ROOT, "data/actions.json");
  writeFileSync(subsitesPath, JSON.stringify(subsites, null, 2) + "\n", "utf8");
  writeFileSync(actionsPath, JSON.stringify(allActions, null, 2) + "\n", "utf8");
  console.log(`[snapshot] wrote ${subsites.length} subsites to ${subsitesPath}`);
  console.log(`[snapshot] wrote ${allActions.length} actions to ${actionsPath}`);
})();
