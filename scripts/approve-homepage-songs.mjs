#!/usr/bin/env node
// Bulk-approve (or un-approve) songs for the homepage "featured song" pool.
//
// The homepage shows a random song from an allowlist: only songs with the
// "Feature on homepage" flag (ACF field `feature_on_homepage`) are eligible
// (see D054). The song librarian normally ticks that box in WP admin; this
// script is for standing up an initial set quickly, or flipping many at once.
//
// Usage:
//   node scripts/approve-homepage-songs.mjs <slug…>            # plan only
//   node scripts/approve-homepage-songs.mjs --file slugs.txt   # slugs from file
//   node scripts/approve-homepage-songs.mjs <slug…> --apply    # POST changes
//   node scripts/approve-homepage-songs.mjs <slug…> --unapprove --apply
//
// Slugs can be passed as args and/or via --file (one slug per line; blank lines
// and #-comments ignored). --apply POSTs to the admin bulk endpoint
// (POST /wp-json/irg/v1/admin-bulk-edit-songs), which needs manage_options + a
// WP application password (PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in
// .env.local) — the same auth the deploy scripts use.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SNAPSHOT = resolve(ROOT, "data/songs-consolidated.json");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const UNAPPROVE = args.includes("--unapprove");
const APPROVE = !UNAPPROVE;

// --file <path> support, plus bare slug args.
const slugs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--file") {
    const path = args[++i];
    if (!path) {
      console.error("--file needs a path");
      process.exit(1);
    }
    for (const line of readFileSync(resolve(ROOT, path), "utf8").split("\n")) {
      const slug = line.split("#")[0].trim();
      if (slug) slugs.push(slug);
    }
  } else if (!a.startsWith("--")) {
    slugs.push(a);
  }
}

if (slugs.length === 0) {
  console.error("No slugs given. Pass slugs as args and/or with --file <path>.");
  process.exit(1);
}

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return env;
}

const songs = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const bySlug = new Map();
for (const s of songs) {
  if (s.slug && s.original_wp_id) bySlug.set(s.slug, s);
}

const changes = [];
const missing = [];
for (const slug of slugs) {
  const s = bySlug.get(slug);
  if (!s) {
    missing.push(slug);
    continue;
  }
  changes.push({ post_id: s.original_wp_id, feature_on_homepage: APPROVE, _slug: slug, _title: s.title });
}

console.log(`${APPROVE ? "APPROVE" : "UNAPPROVE"} ${changes.length} song(s) for the homepage:`);
for (const c of changes) console.log(`  ${c._slug} (#${c.post_id}) — ${c._title}`);
if (missing.length) {
  console.warn(`\nNot found in snapshot (skipped): ${missing.join(", ")}`);
  console.warn("(If a song was just added in WP, run `npm run snapshot` first.)");
}

if (!APPLY) {
  console.log("\nPlan only. Re-run with --apply to POST these changes.");
  process.exit(0);
}

const env = loadEnv();
const base = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
const user = env.WP_USERNAME;
const pass = (env.WP_APP_PASSWORD || "").replace(/\s/g, "");
if (!base || !user || !pass) {
  console.error("Missing PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in .env.local");
  process.exit(1);
}
const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
const url = `${base}/wp-json/irg/v1/admin-bulk-edit-songs`;
const payload = changes.map(({ post_id, feature_on_homepage }) => ({ post_id, feature_on_homepage }));

console.log(`\nPosting ${payload.length} changes to ${url}…`);
const res = await fetch(url, {
  method: "POST",
  headers: { Authorization: auth, "Content-Type": "application/json" },
  body: JSON.stringify({ changes: payload }),
});
const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}
if (!res.ok) {
  console.error(`  ${res.status} ${res.statusText}`);
  console.error(body);
  process.exit(1);
}
console.log("  OK:", JSON.stringify(body, null, 2));
console.log("\nNow run `npm run snapshot` to pull the flags into the committed JSON, then rebuild.");
