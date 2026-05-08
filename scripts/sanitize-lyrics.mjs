#!/usr/bin/env node
// One-off cleanup: lyrics fields with entity-encoded fake-close-tag
// fragments left over from migrating Seattle's <ul><li><em>by Author</em></li>
// markup. The artifacts (e.g. "/em&gt;", "br&gt;") leak into the page as
// visible text and, on some songs, propagate enough mis-parsing that the
// whole lyrics card collapses to a narrow column. This script applies a
// targeted set of regex cleanups and posts the corrected lyrics back via
// the admin bulk-edit endpoint.
//
// Modes:
//   node scripts/sanitize-lyrics.mjs           # plan only
//   node scripts/sanitize-lyrics.mjs --apply   # post to admin endpoint

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "..");
const SNAPSHOT  = resolve(ROOT, "data/songs-consolidated.json");
const PLAN_OUT  = resolve(ROOT, "data/sanitize-lyrics-plan.json");

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

// Targeted sanitizer. Each rule fixes one specific corruption pattern
// observed in the migrated lyrics. Order matters — br&gt; → <br /> goes
// first so subsequent fragment-stripping doesn't accidentally consume it.
// Sanitize only when a real corruption pattern is present. If the input
// has no fragments/empty-em remnants, return the original string verbatim
// — we don't touch trailing whitespace just for cosmetics, otherwise
// every song shows up as "changed."
function sanitizeLyrics(html) {
  if (!html || typeof html !== "string") return html;
  const NEEDS_CLEAN = /\/(?:em|li|strong|p|i|b|u|ul|ol)&gt;|br&gt;/.test(html);
  if (!NEEDS_CLEAN) return html;

  let out = html;
  out = out.replace(/br&gt;/g, "<br />");
  out = out.replace(/\/(?:em|li|strong|p|i|b|u|ul|ol)&gt;/g, "");

  // Drop now-empty paragraph remnants left behind by the removals.
  out = out.replace(/<p>\s*<em>\s*<\/em>\s*<\/p>/g, "");
  out = out.replace(/<p>\s*<em>\s*<\/p>/g, "");
  out = out.replace(/<p>\s*<\/p>/g, "");
  out = out.replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, "");

  // Collapse extra blank lines the removals leave behind, but preserve a
  // single trailing newline if the original had one — keeps the "no
  // cosmetic-only" change guarantee.
  out = out.replace(/\n{3,}/g, "\n\n");

  return out;
}

const data  = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const songs = Array.isArray(data) ? data : (data.songs ?? data);

const changes = [];
for (const s of songs) {
  if (typeof s.original_wp_id !== "number" || s.original_wp_id <= 0) continue;
  const before = s.lyrics || "";
  const after = sanitizeLyrics(before);
  if (after === before) continue;
  changes.push({
    post_id: s.original_wp_id,
    slug: s.slug,
    title: s.title,
    before,
    after,
    lyrics_set: after,
  });
}

writeFileSync(
  PLAN_OUT,
  JSON.stringify({ summary: { total: changes.length }, changes }, null, 2) + "\n",
  "utf8",
);
console.log(`Wrote plan: ${PLAN_OUT}`);
console.log(`Plan: ${changes.length} songs will have lyrics cleaned.`);

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

// Slim the payload — server only needs post_id + lyrics_set.
const payload = {
  changes: changes.map((c) => ({ post_id: c.post_id, lyrics_set: c.lyrics_set })),
};

console.log(`Posting ${changes.length} changes to ${url}…`);
const res = await fetch(url, {
  method:  "POST",
  headers: { Authorization: auth, "Content-Type": "application/json" },
  body:    JSON.stringify(payload),
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
