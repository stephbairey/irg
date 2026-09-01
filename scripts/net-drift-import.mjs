#!/usr/bin/env node
// Import the .net drift songs (data/net-drift-2026-08-30.json) into the
// Songs CPT via /irg/v1/admin-bulk-edit-songs (plugin 3.21.0).
//
// - NEW posts (id > 4615) become songs (create_title, idempotent by title).
//   Title collisions inside the payload are pre-created by ID and listed in
//   data/net-drift-overrides.json ({ netId: wpPostId }).
// - EDITED posts are NOT applied; they're written to
//   data/net-drift-edits-review.md for manual review (curation overlap).
// - Category → Issue mapping mirrors data/seattle-category-mapping.json,
//   updated to the live taxonomy (Gender Issues; Government & Politics split
//   via the reclassify-gov-politics keyword rules; World/Local/About
//   Us/Uncategorized dropped).
//
// Usage: node scripts/net-drift-import.mjs [--apply]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const un = (s) => String(s ?? "")
  .replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "'").replace(/&#8220;|&#8221;/g, '"')
  .replace(/&#0?39;/g, "'").replace(/&quot;/g, '"');

const CATMAP = {
  "Business & Economy": "Business & Economy",
  "Environment & Energy": "Environment & Energy",
  "Health Care/Healthcare": "Healthcare",
  "Human & Civil Rights": "Human & Civil Rights",
  "War & Peace": "War & Peace",
  "Women's Issues": "Gender Issues",
  "Labor & Worker Rights": "Labor & Worker Rights",
  "Soldiers & Veterans": "Soldiers & Veterans",
  "Holiday & Celebrations": "Holiday & Celebrations",
  "Education": "Education",
  // dropped: World Issues (eliminated), Local Issues (no live term),
  // Uncategorized, About Us. Government & Politics handled by keyword split.
};
const ED_KEYWORDS = ["vote","voter","voters","voting","voted","votes","election","elections","electoral","ballot","ballots","poll","polls","polling","democracy","democratic","register","registered","registering","registration","gerrymander","gerrymandering","suffrage"];
const GP_KEYWORDS = ["trump","bush","obama","biden","clinton","reagan","nixon","cheney","corruption","corrupt","congress","congressional","congressman","congresswoman","senate","senator","senators","white house","president","presidential","impeach","impeachment","impeached","executive order","capitol","governor","mayor","oligarch","oligarchs","oligarchy","dictator","politician","politicians"];
const rex = (w) => new RegExp(`\\b(?:${w.map((x)=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})\\b`, "gi");
const ED_RE = rex(ED_KEYWORDS), GP_RE = rex(GP_KEYWORDS);
const strip = (h) => un(String(h||"")).replace(/<[^>]+>/g," ").replace(/\s+/g," ").toLowerCase();

function splitGovPolitics(title, lyrics) {
  const hay = `${title} ${strip(lyrics)}`.toLowerCase();
  const ed = (hay.match(ED_RE) || []).length;
  const gp = (hay.match(GP_RE) || []).length;
  return ed > gp ? "Elections & Democracy" : "Government & Power";
}

// raw .net gaggle string -> [term, provenance-note-or-null]
const GAGMAP = {
  "Charlotte": ["Charlotte", null],
  "Charlotte Raging Grannies": ["Charlotte", null],
  "El Dorado County West Slope Gaggle": ["El Dorado County West Slope", null],
  "Fox Valley (Green Bay)": ["Green Bay", "Gaggle credit as submitted: Fox Valley (Green Bay)"],
  "Grant County, NM Raging Grannies": ["Grant County", null],
  "New Mexico/Piedmont": ["New Mexico", "Gaggle credit as submitted: New Mexico/Piedmont"],
  "Originally: Madison & Dane County, WI (Revision: Tucson, AZ)": ["Tucson", "Originally Madison & Dane County, WI; revision by Tucson, AZ"],
  "Piedmont Raging Grannies": ["Piedmont", null],
  "Piedmont raging Grannies": ["Piedmont", null],
  "Raging Grannies of Madison & Dane County WI": ["Madison", null],
  "Raging Grannies of Tuolumne & Calaveras": ["Tuolumne & Calaveras Counties", null],
  "Revised Lyrics by SF Bay Area/Palo Alto Raging Grannies": ["San Francisco Bay Area", "Revised lyrics by SF Bay Area/Palo Alto Raging Grannies"],
  "Sacramento": ["Sacramento", null],
  "Santa Fe Raging Grannies": ["Santa Fe (historical)", "Gaggle credit as submitted: Santa Fe Raging Grannies"],
  "Sara Williams (Madison, WI) & Vicki Ryder (Triangle, NC)": ["Madison", "By Sara Williams (Madison, WI) & Vicki Ryder (Triangle, NC)"],
  "Seattle": ["Seattle", null],
  "South Florida Raging Grannies": ["South Florida", null],
  "Toronto": ["Toronto", null],
  "Tucson Raging Grannies": ["Tucson", null],
  "Tuscon/Sacramento": ["Tucson", "Gaggle credit as submitted: Tuscon/Sacramento"],
  "Updates from Sacramento gaggle": ["Sacramento", "Updates from Sacramento gaggle"],
};

function autop(html) {
  if (/<p[\s>]/i.test(html)) return html;
  return html.split(/\n{2,}/).map((b) => `<p>${b.trim().replace(/\n/g, "<br />")}</p>`).join("\n");
}

const drift = JSON.parse(readFileSync(resolve(ROOT, "data/net-drift-2026-08-30.json"), "utf8"));
const overridesPath = resolve(ROOT, "data/net-drift-overrides.json");
const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, "utf8")) : {};

const news = drift.filter((p) => p.new);
const edits = drift.filter((p) => !p.new);

const payload = [];
const flags = [];
for (const p of news) {
  const title = un(p.title).trim();
  const rawGaggle = un(p.meta.gaggle || "").trim();
  const cats = (p.terms?.category || []).map(un);
  const issues = new Set();
  for (const c of cats) {
    if (CATMAP[c]) issues.add(CATMAP[c]);
    else if (c === "Government & Politics") issues.add(splitGovPolitics(title, p.content));
  }
  if (!issues.size) {
    issues.add(splitGovPolitics(title, p.content));
    flags.push(`#${p.id} "${title}": no mappable categories (${cats.join(", ") || "none"}); keyword-classified`);
  }
  const [gterm, gnote] = GAGMAP[rawGaggle] || [rawGaggle || "Unknown", rawGaggle ? `Unmapped gaggle string: ${rawGaggle}` : null];
  if (!GAGMAP[rawGaggle] && rawGaggle) flags.push(`#${p.id} "${title}": unmapped gaggle "${rawGaggle}" used verbatim`);

  const entry = {
    lyrics_set: autop(p.content),
    to_songwriter: un(p.meta.lyrics_by || "").trim(),
    tune_set: un(p.meta.tune || "").trim(),
    issues_set: [...issues].join(", "),
    gaggle_add: gterm,
    date_written_set: (p.meta.date_written_or_updated || "").trim(),
  };
  if (overrides[p.id]) entry.post_id = overrides[p.id];
  else entry.create_title = title;
  if ((p.meta.youtube_link || "").trim()) entry.youtube_set = p.meta.youtube_link.trim();
  if ((p.meta.youtube_link_2 || "").trim()) entry.youtube_2_set = p.meta.youtube_link_2.trim();
  if ((p.meta.key_or_starting_note || "").trim()) entry.key_set = p.meta.key_or_starting_note.trim();
  if (gnote) entry.source_notes = gnote; // fill-if-empty variant: never clobbers
  payload.push(entry);
  console.log(`${entry.post_id ? `#${entry.post_id}` : "NEW"}  ${title}  [${entry.issues_set}] gaggle=${gterm}`);
}

// Edits review doc
const md = ["# .net drift: edited songs to review (NOT auto-applied)", "",
  "These 9 songs were edited on raginggrannies.net after the April export.",
  "Compare with the live song and apply manually if wanted.", ""];
for (const p of edits) {
  md.push(`## #${p.id} ${un(p.title)}`, `- .net modified: ${p.modified}`,
    `- gaggle: ${un(p.meta.gaggle || "")} | songwriter: ${un(p.meta.lyrics_by || "")} | tune: ${un(p.meta.tune || "")}`,
    "", "```html", p.content.trim(), "```", "");
}
writeFileSync(resolve(ROOT, "data/net-drift-edits-review.md"), md.join("\n"));

console.log(`\n${payload.length} new songs; ${flags.length} flags; ${edits.length} edits written to data/net-drift-edits-review.md`);
for (const f of flags) console.log("FLAG:", f);

if (!APPLY) { console.log("\nPlan only. Re-run with --apply to POST."); process.exit(0); }

const env = {};
for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const base = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
const pass = (env.WP_APP_PASSWORD || "").replace(/\s/g, "");
const auth = "Basic " + Buffer.from(`${env.WP_USERNAME}:${pass}`).toString("base64");

for (let i = 0; i < payload.length; i += 25) {
  const chunk = payload.slice(i, i + 25);
  const res = await fetch(`${base}/wp-json/irg/v1/admin-bulk-edit-songs`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ changes: chunk }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`chunk ${i / 25 + 1}: HTTP ${res.status} applied=${body.applied} created=${(body.created || []).length} errors=${JSON.stringify(body.errors || [])}`);
  if (!res.ok) process.exit(1);
}
