#!/usr/bin/env node
// Snapshot the Press Photo CPT from the live WPGraphQL endpoint into
// data/press-photos.json. Mirrors the songs/subsites snapshot pattern:
// the WP origin is bot-blocked from CF Pages builds (Imunify360), so the
// photos page reads the committed JSON instead of hitting WP at deploy
// time.
//
// Run locally where the WP origin doesn't bot-block your IP:
//   node scripts/snapshot-photos.mjs
//
// Re-run any time press photos are added, edited, or removed in WP admin.

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
const GRAPHQL = env.PUBLIC_WP_GRAPHQL_ENDPOINT;
if (!GRAPHQL) {
  console.error("Missing PUBLIC_WP_GRAPHQL_ENDPOINT (set in .env.local)");
  process.exit(1);
}

const QUERY = `{
  pressPhotos(first: 100, where: { orderby: { field: DATE, order: DESC } }) {
    nodes {
      databaseId
      title
      slug
      photoCategories { nodes { name slug } }
      pressPhotoDetails {
        photographerCredit
        caption
        usageRights
        photo {
          node {
            sourceUrl
            altText
            mediaDetails {
              width
              height
              sizes { name sourceUrl width height }
            }
          }
        }
      }
    }
  }
  photoCategories(first: 100, where: { hideEmpty: true }) {
    nodes { name slug count }
  }
}`;

(async () => {
  console.log(`[snapshot] querying ${GRAPHQL}`);
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "User-Agent": "irg-build/1.0 (+https://raginggrannies.org)",
    },
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) {
    console.error(`GraphQL ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const json = await res.json();
  if (json.errors) {
    console.error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    process.exit(1);
  }
  const photoCount = json.data?.pressPhotos?.nodes?.length ?? 0;
  const catCount = json.data?.photoCategories?.nodes?.length ?? 0;
  console.log(`[snapshot] received ${photoCount} photos, ${catCount} categories`);

  const out = {
    pressPhotos: json.data.pressPhotos,
    photoCategories: json.data.photoCategories,
  };
  const outPath = resolve(ROOT, "data/press-photos.json");
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`[snapshot] wrote ${outPath}`);
})();
