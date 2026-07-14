#!/usr/bin/env node
// Second-pass songwriter cleanup (2026-07, committee meeting round).
// Rules: the Written By field holds only person names, one term per person.
// Gaggle credits move to the gaggle taxonomy (only mapped to EXISTING terms,
// never creating new gaggle terms). Provenance ("adapted from X", "revised
// by Y") moves to source notes, and only when notes are currently empty —
// the endpoint reports conflicts instead of overwriting.
//
// Values we could not decide are listed in FLAGGED and left untouched.
//
// Modes:
//   node scripts/cleanup-songwriters-2.mjs           # plan-only; writes
//                                                     # data/cleanup-songwriters-2-plan.json
//   node scripts/cleanup-songwriters-2.mjs --apply   # POST to admin-bulk-edit-songs

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SNAPSHOT = resolve(ROOT, "data/songs-consolidated.json");
const PLAN_OUT = resolve(ROOT, "data/cleanup-songwriters-2-plan.json");
const APPLY = process.argv.includes("--apply");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

// Same-person spelling merges applied to every name after splitting.
const NAME_FIXUPS = {
  "Vicki Lewin Ryder": "Vicki Ryder",
  "Vicky Ryder": "Vicki Ryder",
};

// Values needing a human call. Left untouched; surfaced in the report.
const FLAGGED = {
  "Lee": 'First-name-only, 11 songs. Merge into "Lee Stanfield" (Tucson)?',
  "Georgia": "Person's name or the U.S. state?",
  "Pachamama": "Granny nickname or something else?",
  "Side": "Junk value — what was intended?",
  "Madison, original lyrics by Nelson": 'Is "Madison" the gaggle or a person? Who is Nelson?',
  "Montreal?": "Uncertain attribution — confirm Montreal gaggle or leave Unknown?",
  "Gail Sredanovic, Raging Grannies Action League San Francisco":
    'Which gaggle term should "Raging Grannies Action League" map to? (No RGAL term exists; nearest is "San Francisco Bay Area".)',
  "Gail Sredanovic, Raging Grannies Action League, SF Bay Area": "Same RGAL question as above.",
  "Raging Grannies Action League": "Same RGAL question as above.",
  "Lisa Kaufman, Bellingham Grannies": 'No "Bellingham" gaggle term exists — create one?',
  "the Bellingham Grannies": 'No "Bellingham" gaggle term exists — create one?',
  "the Tacoma Raging Grannies": 'No "Tacoma" gaggle term exists — create one?',
  "Eleanor Chithalen, Hamilton, ON Grannies": 'No "Hamilton" gaggle term exists — create one? (Songwriter would become "Eleanor Chithalen".)',
  "Eleanor Chithalen, Hamilton Grans": 'Same Hamilton question as above.',
  "Mary Ray Worley, Wisconsin RGs": '"Wisconsin RGs" — map to the "Madison" gaggle term or create one?',
};

// Explicit rules keyed on the exact raw songwriter value.
// sw: replacement ("" => Unknown, null => leave songwriter untouched)
// notes: source-notes text (written only if the song's notes are empty)
// gaggle: gaggle term to append (must already exist in WP)
const RULES = {
  // --- tune leaked into the field (tune field already correct) ---
  "Laurie RostholderTune: Old McDonald Had a Farm": { sw: "Laurie Rostholder" },

  // --- provenance moves to notes ---
  "Granny Carol (modified from original version by Nora Freeman, NYC Metro)": {
    sw: "Granny Carol", notes: "Modified from original version by Nora Freeman, NYC Metro" },
  "Granny Ruth adapted from original composition by Vicki Ryder": {
    sw: "Granny Ruth", notes: "Adapted from original composition by Vicki Ryder" },
  "Hank Tusinski (edited by Lee)": { sw: "Hank Tusinski", notes: "Edited by Lee" },
  "Kathy Russell, Sunny Armer, (revision of song by Vicki Ryder)": {
    sw: "Kathy Russell, Sunny Armer", notes: "Revision of song by Vicki Ryder" },
  "Marcia Reaver original lyrics by Nora Freeman, NYC Metro": {
    sw: "Marcia Reaver", notes: "Original lyrics by Nora Freeman, NYC Metro" },
  "Marcy Matasick, Albuquerque RG/((Revised for Tucson Gaggle 08/08/17) by Lee": {
    sw: "Marcy Matasick", notes: "Albuquerque RG; revised for Tucson Gaggle 8/8/17 by Lee" },
  "Margaret Villani of Piedmont RGs (Updated by Lee)": {
    sw: "Margaret Villani", notes: "Updated by Lee", gaggle: "Piedmont" },
  "NYC Metro, original lyrics by Vicki Ryder, Rochester": {
    sw: "Vicki Ryder", notes: "NYC Metro version; original lyrics by Vicki Ryder, Rochester",
    gaggle: "New York City Metro" },
  "Nancy Brown, Connie Peabody (Chords)": {
    sw: "Nancy Brown, Connie Peabody", notes: "Chords by Connie Peabody" },
  "Original by Nora Freeman (Revised by Lee Stanfield)": {
    sw: "Nora Freeman", notes: "Revised by Lee Stanfield" },
  "Original by Vicki Ryder (Updated by Lee Stanfield)": {
    sw: "Vicki Ryder", notes: "Updated by Lee Stanfield" },
  "Originally by Granny Rowan (Revised by Lee Stanfield)": {
    sw: "Granny Rowan", notes: "Revised by Lee Stanfield" },
  "Sunny Armer (revision of song byVicki Ryde,r Rochester)": {
    sw: "Sunny Armer", notes: "Revision of song by Vicki Ryder, Rochester" },
  "Sunny Armer revision of Molly Walsh, Montreal lyrics": {
    sw: "Sunny Armer", notes: "Revision of lyrics by Molly Walsh, Montreal" },
  "UnCon Grannies 2016 (Chorus by Vicki Ryder)": {
    sw: "", notes: "Written collectively by the UnCon Grannies, 2016; chorus by Vicki Ryder" },
  "Victoria BC Grannies; additional lyrics by Vicki Ryder": {
    sw: "", notes: "By the Victoria BC Grannies; additional lyrics by Vicki Ryder",
    gaggle: "Victoria (historical)" },
  "various (updated by Marcy Matasick)": {
    sw: "", notes: "By various grannies; updated by Marcy Matasick" },
  "Original Lyrics: Vicki Ryder. Modifications to fit Amazing Grace, Pamela Blyth": {
    sw: "Vicki Ryder", notes: "Modifications to fit Amazing Grace by Pamela Blyth" },

  // --- gaggle credit in the songwriter field ---
  "Davis CA gaggle": { sw: "", gaggle: "Davis" },
  "Detroit": { sw: "", gaggle: "Metro Detroit" },
  "Eva Monroe, Halifax Gaggle": { sw: "Eva Monroe", gaggle: "Halifax" },
  "From Raging Grannies Songbook 1993": { sw: "", notes: "From the Raging Grannies Songbook (1993)" },
  "Gaggle": { sw: "" },
  "Halifax unconvention collaboration": { sw: "", notes: "Halifax unConvention collaboration" },
  "Halton Grannies": { sw: "", gaggle: "Halton (historical)" },
  "Montreal Raging Grannies": { sw: "", gaggle: "Montreal" },
  "NYC Metro": { sw: "", gaggle: "New York City Metro" },
  "New Mexico Raging Grannies": { sw: "", gaggle: "New Mexico" },
  "Nora Freeman, NYC Metro Raging Grannies": { sw: "Nora Freeman", gaggle: "New York City Metro" },
  "Nora Freeman, NYC Metro gaggle": { sw: "Nora Freeman", gaggle: "New York City Metro" },
  "Piedmont Raging Grannies": { sw: "", gaggle: "Piedmont" },
  "Pittsburgh Gaggle": { sw: "", gaggle: "Pittsburgh" },
  "Raging Grannies SF Bay Area/Palo Alto": { sw: "", gaggle: "San Francisco Bay Area" },
  "Raging Grannies, Guelph": { sw: "", gaggle: "Guelph" },
  "Rochester Raging Grannies": { sw: "", gaggle: "Rochester" },
  "Rose DeShaw, Kingston, Ontario": { sw: "Rose DeShaw", gaggle: "Kingston (historical)" },
  "SF Bay Area Raging Grannies": { sw: "", gaggle: "San Francisco Bay Area" },
  "SF Bay Area/SF Peninsula Raging Grannies": { sw: "", gaggle: "San Francisco Bay Area" },
  "Several Grannies": { sw: "" },
  "Sunny Armer. New York Metro Grannies": { sw: "Sunny Armer", gaggle: "New York City Metro" },
  "The Triangle (NC) Raging Grannies": { sw: "", gaggle: "Triangle" },
  "Toronto Grans": { sw: "", gaggle: "Toronto" },
  "Tucson Raging Grannies": { sw: "", gaggle: "Tucson" },
  "Victoria Grans": { sw: "", gaggle: "Victoria (historical)" },
  "Western Mass Grannies": { sw: "", gaggle: "Western Massachusetts" },
  "the Halifax Grannies": { sw: "", gaggle: "Halifax" },
  "the Tacoma Raging Grannies": null, // flagged
  "various grannies": { sw: "" },
  "Catherine Verrall Regina, Sask grans": {
    sw: "Catherine Verrall", gaggle: "Regina (historical)" },

  // --- first-name-only / non-names ---
  "Fresno": { sw: "", gaggle: "Fresno" },
  "various": { sw: "" },
};

function splitNames(s) {
  return s.split(/,| and | & /i).map((p) => p.trim()).filter(Boolean);
}
function fixName(n) {
  return NAME_FIXUPS[n] ?? n;
}
function isFirstNameOnly(name) {
  return name.trim().split(/\s+/).filter(Boolean).length < 2;
}

const data = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const songs = Array.isArray(data) ? data : data.songs;

const plan = [];
const flaggedHits = new Map();
for (const s of songs) {
  if (typeof s.original_wp_id !== "number" || s.original_wp_id <= 0) continue;
  const sw = (s.songwriter || "").trim();
  if (!sw) continue;

  if (Object.prototype.hasOwnProperty.call(FLAGGED, sw)) {
    if (!flaggedHits.has(sw)) flaggedHits.set(sw, []);
    flaggedHits.get(sw).push(s.slug);
    continue;
  }

  let action = null;
  const rule = RULES[sw];
  if (rule) {
    action = {
      kind: "rule",
      post_id: s.original_wp_id,
      slug: s.slug,
      title: s.title,
      from: sw,
      to_songwriter: rule.sw === "" ? "Unknown" : rule.sw ?? undefined,
      source_notes: rule.notes ?? null,
      gaggle_add: rule.gaggle ?? null,
      existing_source_notes: s.source_notes || "",
    };
  } else if (/ and | & | with |\//i.test(sw) || /,/.test(sw)) {
    // Generic multi-name split. Drop first-name-only fragments (the
    // "we're not going to guess" rule); apply spelling merges.
    const parts = splitNames(sw).map(fixName);
    const kept = parts.filter((n) => !isFirstNameOnly(n));
    const target = kept.length === 0 ? "Unknown" : kept.join(", ");
    if (target === sw) continue;
    action = {
      kind: "split",
      post_id: s.original_wp_id,
      slug: s.slug,
      title: s.title,
      from: sw,
      to_songwriter: target,
      source_notes: kept.length < parts.length ? `Songwriter credit as originally listed: ${sw}` : null,
      gaggle_add: null,
      existing_source_notes: s.source_notes || "",
    };
  }
  if (action) plan.push(action);
}

const summary = {
  total: plan.length,
  by_kind: plan.reduce((a, p) => ((a[p.kind] = (a[p.kind] || 0) + 1), a), {}),
  notes_conflicts_expected: plan.filter((p) => p.source_notes && p.existing_source_notes.trim() !== "").length,
  flagged: Object.fromEntries(
    [...flaggedHits.entries()].map(([v, slugs]) => [v, { why: FLAGGED[v], songs: slugs }]),
  ),
};

writeFileSync(PLAN_OUT, JSON.stringify({ summary, changes: plan }, null, 2) + "\n");
console.log(`Wrote plan: ${PLAN_OUT}`);
console.log(JSON.stringify(summary, null, 2));

if (APPLY) {
  const env = loadEnv();
  const base = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
  const auth = "Basic " + Buffer.from(`${env.WP_USERNAME}:${(env.WP_APP_PASSWORD || "").replace(/\s/g, "")}`).toString("base64");
  const payload = plan.map(({ post_id, to_songwriter, source_notes, gaggle_add }) => {
    const c = { post_id };
    if (to_songwriter !== undefined) c.to_songwriter = to_songwriter;
    if (source_notes) c.source_notes = source_notes;
    if (gaggle_add) c.gaggle_add = gaggle_add;
    return c;
  });
  console.log(`Posting ${payload.length} changes…`);
  const res = await fetch(`${base}/wp-json/irg/v1/admin-bulk-edit-songs`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ changes: payload }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`HTTP ${res.status}`, JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log("OK:", JSON.stringify(body, null, 2));
}
