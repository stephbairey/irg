#!/usr/bin/env node
// One-off: push the IRGC homepage refresh (August 2026) to WordPress.
//
// Reads data/homepage-refresh/changes.json, resolves each slug to its WP post
// id via the committed snapshot, attaches lyrics from
// data/homepage-refresh/lyrics/<slug>.html when "lyrics": true, sets
// feature_on_homepage=true on every entry, and POSTs the lot to
// /wp-json/irg/v1/admin-bulk-edit-songs (plugin >= 3.19.0 for tune_set /
// issues_set / source_notes_set / create_title).
//
// Usage:
//   node scripts/homepage-refresh.mjs            # plan only
//   node scripts/homepage-refresh.mjs --apply    # POST
//
// Idempotent: re-running re-sets the same values; create_title finds the
// existing post by exact title on a second run instead of duplicating.
// The old allowlist is cleared separately:
//   node scripts/approve-homepage-songs.mjs --file data/homepage-refresh/old-featured.txt --unapprove --apply

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = resolve(ROOT, "data/homepage-refresh");
const APPLY = process.argv.includes("--apply");

const snapshot = JSON.parse(readFileSync(resolve(ROOT, "data/songs-consolidated.json"), "utf8"));
const bySlug = new Map(snapshot.filter((s) => s.slug && s.original_wp_id).map((s) => [s.slug, s]));
const { changes } = JSON.parse(readFileSync(resolve(DIR, "changes.json"), "utf8"));

const payload = [];
for (const c of changes) {
  const { slug, lyrics, ...rest } = c;
  const snap = bySlug.get(slug);
  const entry = { ...rest, feature_on_homepage: true };
  if (snap) entry.post_id = snap.original_wp_id;
  else if (!rest.create_title) {
    console.error(`No snapshot entry for ${slug} and no create_title; aborting.`);
    process.exit(1);
  }
  if (lyrics) {
    const path = resolve(DIR, "lyrics", `${slug}.html`);
    if (!existsSync(path)) {
      console.error(`Missing ${path}`);
      process.exit(1);
    }
    entry.lyrics_set = readFileSync(path, "utf8").trim();
  }
  payload.push(entry);
  const keys = Object.keys(entry).filter((k) => !["post_id", "feature_on_homepage"].includes(k));
  console.log(`${snap ? `#${snap.original_wp_id}` : "NEW"}  ${slug}  [${keys.join(", ") || "feature only"}]`);
}
console.log(`\n${payload.length} songs; ${payload.filter((p) => p.lyrics_set).length} with lyrics; ${payload.filter((p) => p.create_title && !p.post_id).length} to create.`);

if (!APPLY) {
  console.log("Plan only. Re-run with --apply to POST.");
  process.exit(0);
}

const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const base = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
const pass = (env.WP_APP_PASSWORD || "").replace(/\s/g, "");
if (!base || !env.WP_USERNAME || !pass) {
  console.error("Missing PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in .env.local");
  process.exit(1);
}
const res = await fetch(`${base}/wp-json/irg/v1/admin-bulk-edit-songs`, {
  method: "POST",
  headers: {
    Authorization: "Basic " + Buffer.from(`${env.WP_USERNAME}:${pass}`).toString("base64"),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ changes: payload }),
});
const text = await res.text();
console.log(`HTTP ${res.status}`);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text.slice(0, 2000));
}
if (!res.ok) process.exit(1);
