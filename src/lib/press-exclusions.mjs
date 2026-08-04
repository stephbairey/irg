// Press exclusion list (pre-cutover plan, workstream F1 / D065).
//
// One shared module so the two consumers can never drift:
//   - scripts/fetch-press.mjs skips excluded items on ingest
//   - src/pages/in-the-news.astro filters at build, so already-archived
//     items disappear on the next deploy
//
// Plain .mjs (not .ts) because the node ingest script imports it directly.
// Non-destructive and instantly reversible: removing an entry from
// data/press-exclusions.json brings an archived item back.
//
// Matching: `urls` are exact strings (post-D047 rows carry the Google News
// redirect URL, pre-D047 rows the publisher URL — both stable). `titles`
// are compared after normalisation, same rules as the ingest dedupe.

import { readFileSync, existsSync } from "node:fs";

export function normaliseTitle(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function loadExclusions(path) {
  const empty = { urls: new Set(), titles: new Set() };
  if (!existsSync(path)) return empty;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return {
      urls: new Set(Array.isArray(raw?.urls) ? raw.urls : []),
      titles: new Set(
        (Array.isArray(raw?.titles) ? raw.titles : []).map(normaliseTitle),
      ),
    };
  } catch (err) {
    // A broken file must not quietly un-hide curated-out items; make noise.
    console.warn(`[press] could not parse exclusions at ${path}: ${err.message}`);
    return empty;
  }
}

export function isExcluded(item, exclusions) {
  return (
    exclusions.urls.has(item.url) ||
    exclusions.titles.has(normaliseTitle(item.title))
  );
}
