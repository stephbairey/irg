#!/usr/bin/env node
// Probe a single multisite subsite to figure out why WPGraphQL / REST
// aren't exposing expected content.
//
// Usage:
//   node scripts/diagnose-subsite.mjs [slug]      # defaults to "portland"

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const slug = process.argv[2] || "portland";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(__dirname, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const BASE = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
const USER = env.WP_USERNAME;
const PASS = env.WP_APP_PASSWORD?.replace(/\s/g, "");
if (!BASE || !USER || !PASS) {
  console.error("Missing env vars (PUBLIC_WP_URL, WP_USERNAME, WP_APP_PASSWORD)");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");
const SITE = `${BASE}/${slug}`;

function label(msg) {
  console.log(`\n--- ${msg} ---`);
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: AUTH,
      Accept: "application/json",
      "Cache-Control": "no-cache",
      ...(opts.headers || {}),
    },
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { res, body };
}

console.log(`=== Diagnosing "${slug}" at ${SITE} ===`);

// 1. Site reachable + REST discovery
label("REST root");
{
  const { res, body } = await fetchJson(`${SITE}/wp-json/`);
  console.log(`  GET ${SITE}/wp-json/ → ${res.status}`);
  if (body) {
    console.log(`    name: ${body.name}`);
    console.log(`    url:  ${body.url}`);
    console.log(`    home: ${body.home}`);
    console.log(`    namespaces: ${(body.namespaces || []).join(", ")}`);
  }
}

// 2. What types + taxonomies are registered?
label("Registered post types");
{
  const { res, body } = await fetchJson(`${SITE}/wp-json/wp/v2/types`);
  console.log(`  GET /wp/v2/types → ${res.status}`);
  if (body && typeof body === "object") {
    for (const [key, info] of Object.entries(body)) {
      console.log(`    ${key.padEnd(16)} rest_base=${info.rest_base || "-"}  viewable=${info.viewable ?? "?"}`);
    }
  }
}

// 3. Posts by status (authenticated, context=edit)
label("Posts by status (authenticated)");
for (const status of ["publish", "draft", "pending", "private", "future", "trash", "any"]) {
  const url = `${SITE}/wp-json/wp/v2/posts?per_page=3&context=edit&status=${status}`;
  const { res } = await fetchJson(url);
  console.log(`  status=${status.padEnd(8)} → ${res.status} X-WP-Total=${res.headers.get("X-WP-Total") ?? "?"}`);
}

// 4. One sample post with context=edit (fields that'd show author + status)
label("First 3 posts (any status, context=edit)");
{
  const { res, body } = await fetchJson(
    `${SITE}/wp-json/wp/v2/posts?per_page=3&context=edit&status=any&_fields=id,title,status,date,author,slug`,
  );
  console.log(`  → ${res.status} X-WP-Total=${res.headers.get("X-WP-Total") ?? "?"}`);
  if (Array.isArray(body)) {
    for (const p of body) {
      const title = typeof p.title === "object" ? (p.title.raw ?? p.title.rendered) : p.title;
      console.log(`    #${p.id}  status=${p.status}  author=${p.author}  date=${(p.date || "").slice(0, 10)}  "${title}"`);
    }
  }
}

// 5. Pages (to rule out whether it's a post-type-specific issue)
label("Pages");
{
  const { res, body } = await fetchJson(
    `${SITE}/wp-json/wp/v2/pages?per_page=3&context=edit&status=any&_fields=id,title,status,date,author`,
  );
  console.log(`  → ${res.status} X-WP-Total=${res.headers.get("X-WP-Total") ?? "?"}`);
  if (Array.isArray(body)) {
    for (const p of body) {
      const title = typeof p.title === "object" ? (p.title.raw ?? p.title.rendered) : p.title;
      console.log(`    #${p.id}  status=${p.status}  author=${p.author}  "${title}"`);
    }
  }
}

// 6. Users on this subsite
label("Users on this subsite");
{
  const { res, body } = await fetchJson(`${SITE}/wp-json/wp/v2/users?per_page=20&context=edit&_fields=id,slug,name,roles`);
  console.log(`  → ${res.status} X-WP-Total=${res.headers.get("X-WP-Total") ?? "?"}`);
  if (Array.isArray(body)) {
    for (const u of body) {
      console.log(`    #${u.id}  ${u.slug.padEnd(22)}  ${(u.name || "").padEnd(30)}  roles=${(u.roles || []).join(",")}`);
    }
  }
}

// 7. Distinct author IDs actually used by posts on this subsite
label("Distinct author IDs used by posts");
{
  const { res, body } = await fetchJson(
    `${SITE}/wp-json/wp/v2/posts?per_page=100&context=edit&status=any&_fields=id,author`,
  );
  if (Array.isArray(body)) {
    const byAuthor = new Map();
    for (const p of body) byAuthor.set(p.author, (byAuthor.get(p.author) ?? 0) + 1);
    if (byAuthor.size === 0) {
      console.log(`  → ${res.status} (no posts returned at all)`);
    } else {
      for (const [id, n] of [...byAuthor.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`    author_id=${id}: ${n} posts`);
      }
    }
  }
}

// 8. GraphQL: does the subsite's /graphql respond, and does it see posts?
label("GraphQL");
{
  const queries = [
    { name: "posts (default)", q: `{ posts(first:3){ nodes{ title status date } } }` },
    { name: "pages", q: `{ pages(first:3){ nodes{ title status } } }` },
    {
      name: "posts with all statuses",
      q: `{ posts(first:3, where:{stati:[PUBLISH,DRAFT,PENDING,PRIVATE,FUTURE]}){ nodes{ title status date } } }`,
    },
  ];
  for (const { name, q } of queries) {
    const r = await fetch(`${SITE}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    let body;
    try {
      body = await r.json();
    } catch {
      body = null;
    }
    const nodes = body?.data?.posts?.nodes ?? body?.data?.pages?.nodes ?? null;
    const err = body?.errors?.[0]?.message;
    console.log(`  ${name.padEnd(28)} → ${r.status}  nodes=${nodes ? nodes.length : "?"}  err=${err || "-"}`);
    if (nodes && nodes.length) {
      for (const n of nodes) console.log(`    ${JSON.stringify(n)}`);
    }
  }
}

// 9. Raw query against /wp-admin/edit.php to see what the admin sees (sanity)
label("Hint: admin list URL for manual inspection");
console.log(`  ${SITE}/wp-admin/edit.php?post_status=all&post_type=post`);
