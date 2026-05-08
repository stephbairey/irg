#!/usr/bin/env node
// One-off cleanup: songs whose `songwriter` field encodes multiple authors
// in a single term ("Sandy Schwartz & Marcy Matasick") get split into
// proper comma-separated terms. Plus a hand-curated set of special cases
// where Maya wanted provenance moved to source_notes or gaggle credits
// added.
//
// Modes:
//   node scripts/cleanup-songwriters.mjs           # plan-only; writes
//                                                   # data/cleanup-songwriters-plan.json
//   node scripts/cleanup-songwriters.mjs --apply   # POST changes to the
//                                                   # admin-only bulk endpoint
//
// The bulk endpoint (POST /wp-json/irg/v1/admin-bulk-edit-songs) requires
// manage_options + WP application password (Basic auth) — same auth the
// deploy scripts already use.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "..");
const SNAPSHOT  = resolve(ROOT, "data/songs-consolidated.json");
const PLAN_OUT  = resolve(ROOT, "data/cleanup-songwriters-plan.json");

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

// Capitalize a single name token. Preserves internal caps (DeShaw, McCoy)
// — if any uppercase letter is already present, leave it alone. Otherwise
// title-case the first letter and lowercase the rest.
function normWord(word) {
  if (!word) return word;
  if (/[A-Z]/.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(normWord)
    .join(" ")
    .trim();
}

// Split a multi-author string on "," / " and " / " & " and trim each piece.
// Drops empty pieces. Used for clean conjunction cases.
function splitNames(s) {
  return s
    .split(/,| and | & /i)
    .map((p) => p.trim())
    .filter(Boolean);
}

// First-name-only ⇒ a single word. We treat these as ambiguous and remove
// per Maya's "we're not going to guess" rule. If after filtering the list
// is empty, the song's songwriter becomes "Unknown".
function isFirstNameOnly(name) {
  return name.trim().split(/\s+/).filter(Boolean).length < 2;
}

function dropAmbiguous(names) {
  return names.filter((n) => !isFirstNameOnly(n));
}

// Hand-curated rules for the 12 annotated cases + Piedmont. Keys are the
// raw songwriter values as they appear in the database; values describe
// what to do.
//
// Action shape: { songwriter: string|null, source_notes: string|null,
//                 gaggle_add: string|null }
//   songwriter      — replacement value (comma-separated). null leaves
//                     untouched (used when only source_notes / gaggle
//                     change is needed). Empty string ⇒ "Unknown".
//   source_notes    — text to write into source_notes if the field is
//                     currently empty. If non-empty, we report a conflict
//                     and skip the source_notes write for that song.
//   gaggle_add      — gaggle term to append (additive, doesn't remove
//                     existing terms).
const SPECIAL_RULES = {
  "Candice Davies, with Vicki Ryder and Jade Dell": {
    songwriter:   "Candice Davies, Vicki Ryder, Jade Dell",
    source_notes: null,
    gaggle_add:   null,
  },
  "Corinne Willinger. NYC Metro Raging Grannies and Their Daughters": {
    songwriter:   "Corinne Willinger",
    source_notes: null,
    gaggle_add:   null,
  },
  "Granny Carol (modified from Now! Now! Now! by Peggy Dempsey and Vicki Ryder, Rochester/North Carolina)": {
    songwriter:   "Granny Carol",
    source_notes: "Modified from Now! Now! Now! by Peggy Dempsey and Vicki Ryder, Rochester/North Carolina",
    gaggle_add:   null,
  },
  "Hank Tusinski 4/25/17, revised by Lee & Marti": {
    // Per Maya read (a): Lee/Marti are first-name-only, drop from songwriter.
    songwriter:   "Hank Tusinski",
    source_notes: "Revised by Lee and Marti",
    gaggle_add:   null,
  },
  "Kathy Miner, with thanks to Granny Pat on the E-vine, and Sheila Plotkin": {
    songwriter:   "Kathy Miner",
    source_notes: "With thanks to Granny Pat on the E-vine, and Sheila Plotkin",
    gaggle_add:   null,
  },
  "Lyrics by: Edith Johnson updates by Geri Coptich, Roxanne Klein & Peggy Rosenthal": {
    songwriter:   "Edith Johnson",
    source_notes: "Updates by Geri Coptich, Roxanne Klein & Peggy Rosenthal",
    gaggle_add:   null,
  },
  "Marcia Reaver with thanks to Rose DeShaw, Kingston, ON": {
    songwriter:   "Marcia Reaver",
    source_notes: "With thanks to Rose DeShaw, Kingston, ON",
    gaggle_add:   null,
  },
  "Original by Vicky Ryder (updated by Lee & Marta)": {
    // Note: existing data uses "Vicki" elsewhere — normalize.
    songwriter:   "Vicki Ryder",
    source_notes: "Updated by Lee and Marta",
    gaggle_add:   null,
  },
  "Lee revised original by Jade Dell and Vicki Ryder, North Carolina": {
    songwriter:   "Jade Dell, Vicki Ryder",
    source_notes: "Revised by Lee",
    gaggle_add:   null,
  },
  "Rose DeShaw revisions Connie Graves & Vicki Ryder": {
    songwriter:   "Rose DeShaw",
    source_notes: "Revised by Connie Graves & Vicki Ryder",
    gaggle_add:   null,
  },
  "Sally-Alice Thompson with added lyrics by Marcy Matasick": {
    songwriter:   "Sally-Alice Thompson, Marcy Matasick",
    source_notes: null,
    gaggle_add:   null,
  },
  "Victoria Grans with revisions by Seattle and Rochester": {
    songwriter:   "", // ⇒ Unknown
    source_notes: "By Victoria Grans with revisions by Seattle and Rochester",
    gaggle_add:   null,
  },
  "Piedmont Grannies and Debby Lake": {
    songwriter:   "Debby Lake",
    source_notes: null,
    gaggle_add:   "Piedmont", // only added if not already on the song
  },
  // The single-word rule would drop "Emily" — but here the surname
  // implicitly carries across both. Keep as a pair with explicit surnames.
  "Emily and Paula Miller": {
    songwriter:   "Emily Miller, Paula Miller",
    source_notes: null,
    gaggle_add:   null,
  },
  // Collective-preface lists with first-name-only entries — preserve the
  // raw string in source_notes so attribution isn't lost outright.
  "Grannies Ruth, Annie and Lee": {
    songwriter:   "", // ⇒ Unknown
    source_notes: "Grannies Ruth, Annie and Lee",
    gaggle_add:   null,
  },
  "Grannies R and S": {
    songwriter:   "", // ⇒ Unknown
    source_notes: null,
    gaggle_add:   null,
  },
};

// Trailing-comma / spelling fixups beyond the 12 specials. These are
// other oddities surfaced during audit that don't need source_notes /
// gaggle changes — just a clean term list.
const FIXUPS = {
  "Nora Freeman and Sunny Armer,": "Nora Freeman, Sunny Armer", // strip trailing comma
};

// Build the plan from the snapshot.
function buildPlan() {
  const data = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const songs = Array.isArray(data) ? data : (data.songs ?? data);

  const plan = [];
  for (const s of songs) {
    if (typeof s.original_wp_id !== "number" || s.original_wp_id <= 0) continue;
    const sw = (s.songwriter || "").trim();
    if (!sw) continue;

    let action = null;

    if (Object.prototype.hasOwnProperty.call(SPECIAL_RULES, sw)) {
      const rule = SPECIAL_RULES[sw];
      const target = rule.songwriter == null
        ? sw
        : (rule.songwriter === "" ? "Unknown" : rule.songwriter);
      action = {
        kind:           "special",
        post_id:        s.original_wp_id,
        slug:           s.slug,
        title:          s.title,
        from:           sw,
        to_songwriter:  target,
        source_notes:   rule.source_notes,
        gaggle_add:     rule.gaggle_add,
        existing_source_notes: s.source_notes || "",
        existing_gaggle:       s.gaggle || "",
      };
    } else if (Object.prototype.hasOwnProperty.call(FIXUPS, sw)) {
      action = {
        kind:           "fixup",
        post_id:        s.original_wp_id,
        slug:           s.slug,
        title:          s.title,
        from:           sw,
        to_songwriter:  FIXUPS[sw],
        source_notes:   null,
        gaggle_add:     null,
      };
    } else if (/ & | and /i.test(sw)) {
      // Generic split on " & " / " and " / "," — applies to the clean cases.
      const parts = splitNames(sw).map(normName);
      const filtered = dropAmbiguous(parts);
      const target = filtered.length === 0 ? "Unknown" : filtered.join(", ");
      // Skip a no-op: if the existing string is already comma-separated
      // and matches the target, no change.
      const existingNorm = splitNames(sw).map(normName).join(", ");
      if (target === sw) continue;
      action = {
        kind:           "split",
        post_id:        s.original_wp_id,
        slug:           s.slug,
        title:          s.title,
        from:           sw,
        to_songwriter:  target,
        source_notes:   null,
        gaggle_add:     null,
        notes:          (filtered.length < parts.length)
                          ? "Dropped first-name-only entries: " + parts.filter(isFirstNameOnly).join(", ")
                          : null,
      };
    }

    if (action) plan.push(action);
  }

  return plan;
}

async function applyPlan(plan, env) {
  const base = (env.PUBLIC_WP_URL || "").replace(/\/$/, "");
  const user = env.WP_USERNAME;
  const pass = (env.WP_APP_PASSWORD || "").replace(/\s/g, "");
  if (!base || !user || !pass) {
    console.error("Missing PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in .env.local");
    process.exit(1);
  }
  const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  const url = `${base}/wp-json/irg/v1/admin-bulk-edit-songs`;

  console.log(`Posting ${plan.length} changes to ${url}…`);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ changes: plan }),
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
}

const plan = buildPlan();

// Group + summarize for the human-readable view.
const summary = {
  total: plan.length,
  by_kind: plan.reduce((acc, p) => { acc[p.kind] = (acc[p.kind] || 0) + 1; return acc; }, {}),
  source_notes_conflicts: plan.filter(
    (p) => p.source_notes && p.existing_source_notes && p.existing_source_notes.trim() !== "",
  ).length,
};

writeFileSync(
  PLAN_OUT,
  JSON.stringify({ summary, changes: plan }, null, 2) + "\n",
  "utf8",
);
console.log(`Wrote plan: ${PLAN_OUT}`);
console.log(`Summary: ${JSON.stringify(summary)}`);

if (APPLY) {
  await applyPlan(plan, loadEnv());
}
