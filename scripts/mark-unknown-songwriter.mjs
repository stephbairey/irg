#!/usr/bin/env node
// One-off cleanup: every song in the consolidated snapshot with an empty
// songwriter field gets the "Unknown" term attached. Maya plans to rename
// "Unknown" → "Not listed" via WP admin afterward, which preserves all
// term-to-post relationships set here (renaming a term doesn't detach
// posts).
//
// Modes:
//   node scripts/mark-unknown-songwriter.mjs           # plan only
//   node scripts/mark-unknown-songwriter.mjs --apply   # post to admin endpoint
//
// Reuses the admin-bulk-edit endpoint: /wp-json/irg/v1/admin-bulk-edit-songs.
// Auth via WP application password from .env.local — same as the deploy
// scripts.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "..");
const SNAPSHOT  = resolve(ROOT, "data/songs-consolidated.json");
const PLAN_OUT  = resolve(ROOT, "data/mark-unknown-plan.json");

const APPLY = process.argv.includes("--apply");

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

const data  = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const songs = Array.isArray(data) ? data : (data.songs ?? data);

const changes = songs
  .filter((s) => typeof s.original_wp_id === "number" && s.original_wp_id > 0)
  .filter((s) => !(s.songwriter || "").trim())
  .map((s) => ({
    post_id:       s.original_wp_id,
    slug:          s.slug,
    title:         s.title,
    from:          "(empty)",
    to_songwriter: "Unknown",
    source_notes:  null,
    gaggle_add:    null,
  }));

writeFileSync(
  PLAN_OUT,
  JSON.stringify({ summary: { total: changes.length }, changes }, null, 2) + "\n",
  "utf8",
);
console.log(`Wrote plan: ${PLAN_OUT}`);
console.log(`Plan: ${changes.length} songs will be tagged "Unknown".`);

if (!APPLY) {
  console.log('(plan-only; pass --apply to send to the admin endpoint)');
  process.exit(0);
}

const env  = loadEnv();
const base = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
const user = env.WP_USERNAME;
const pass = (env.WP_APP_PASSWORD || "").replace(/\s/g, "");
if (!base || !user || !pass) {
  console.error("Missing PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in .env.local");
  process.exit(1);
}
const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
const url  = `${base}/wp-json/irg/v1/admin-bulk-edit-songs`;

console.log(`Posting ${changes.length} changes to ${url}…`);
const res = await fetch(url, {
  method:  "POST",
  headers: { Authorization: auth, "Content-Type": "application/json" },
  body:    JSON.stringify({ changes }),
});
const text = await res.text();
let body;
try { body = JSON.parse(text); } catch { body = text; }
if (!res.ok) {
  console.error(`  ${res.status} ${res.statusText}`);
  console.error(body);
  process.exit(1);
}
console.log("  OK:", JSON.stringify(body, null, 2));
