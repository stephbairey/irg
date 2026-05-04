#!/usr/bin/env node
// Fetch new "Raging Grannies" press clippings from Google News RSS and merge
// them into data/press-clippings.json (the single source of truth for the
// /in-the-news/ page).
//
// History note: this used to query The News API. That source had broad gaps
// in coverage (notably small/regional outlets that actually cover gaggles)
// and a 3-results-per-call free-tier limit that, combined with a default
// "relevance" sort, returned the same handful of 2022 articles every build.
// Replaced with Google News RSS (D047): no API key, ~100 results per call,
// covers the long tail of local press.
//
// Idempotent and failure-tolerant:
//   - Missing/invalid archive → starts fresh with [].
//   - Network error, non-2xx, malformed XML → logs a warning and exits 0.
//     The build continues using whatever's already in the archive.
//   - Dedupes by normalised title (lowercase, punctuation/whitespace stripped).
//
// Runs as part of `npm run prebuild` ahead of the songsheet generator, plus
// daily via .github/workflows/fetch-press.yml.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ARCHIVE = resolve(ROOT, "data/press-clippings.json");

function normaliseTitle(t) {
  return String(t || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadArchive() {
  if (!existsSync(ARCHIVE)) {
    mkdirSync(dirname(ARCHIVE), { recursive: true });
    writeFileSync(ARCHIVE, "[]\n", "utf8");
    return [];
  }
  try {
    const data = JSON.parse(readFileSync(ARCHIVE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[press] archive is invalid JSON, treating as empty: ${err.message}`);
    return [];
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Google News titles arrive as "Headline - Source Name". Strip the suffix
// when it matches the <source> element so we store a clean headline.
function trimTitleSuffix(title, source) {
  if (!source) return title;
  const suffix = ` - ${source}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

async function fetchFromGoogleNews(latestArchivedDate) {
  const params = new URLSearchParams({
    // Quoted phrase so the index returns matches for "raging grannies"
    // exactly, not articles that mention the words separately.
    q: '"raging grannies"',
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  const url = `https://news.google.com/rss/search?${params.toString()}`;

  let body;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml",
        "User-Agent": "irg-press-bot/1.0 (+https://raginggrannies.org)",
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `[press] Google News returned ${res.status} ${res.statusText} — keeping existing archive. ${text.slice(0, 200)}`,
      );
      return [];
    }
    body = await res.text();
  } catch (err) {
    console.warn(`[press] fetch failed: ${err.message} — keeping existing archive`);
    return [];
  }

  let parsed;
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      // Coerce single-item channels to arrays for consistent iteration.
      isArray: (name) => name === "item",
    });
    parsed = parser.parse(body);
  } catch (err) {
    console.warn(`[press] could not parse RSS: ${err.message}`);
    return [];
  }

  const items = parsed?.rss?.channel?.item ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  // Skip anything older than (latest known - 1 day) so we don't waste cycles
  // on items we've already deduped against. The buffer covers same-day
  // arrivals that landed in the feed late.
  let cutoffMs = 0;
  if (latestArchivedDate) {
    const d = new Date(`${latestArchivedDate}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) {
      cutoffMs = d.getTime() - 24 * 3600 * 1000;
    }
  }

  const out = [];
  for (const it of items) {
    const rawTitle = String(it.title ?? "").trim();
    if (!rawTitle) continue;

    // <source> may be a string or an object with `#text` and `@_url`.
    const sourceRaw = it.source;
    const source =
      typeof sourceRaw === "string"
        ? sourceRaw.trim()
        : String(sourceRaw?.["#text"] ?? "").trim();

    const url = String(it.link ?? "").trim();
    if (!url) continue;

    const pubDate = String(it.pubDate ?? "").trim();
    const dt = pubDate ? new Date(pubDate) : null;
    if (!dt || Number.isNaN(dt.getTime())) continue;
    if (cutoffMs && dt.getTime() < cutoffMs) continue;

    out.push({
      title: trimTitleSuffix(rawTitle, source),
      source,
      url,
      published_at: dt.toISOString().slice(0, 10),
      // Google News RSS doesn't carry a useful description (just a wrapped
      // <a>). The page falls back to title-only when snippet is empty.
      snippet: "",
      image_url: null,
      fetched_at: todayIso(),
    });
  }
  return out;
}

(async () => {
  const existing = loadArchive();
  const seenTitles = new Set(existing.map((a) => normaliseTitle(a.title)));
  const latestArchivedDate = existing
    .map((a) => a.published_at)
    .filter((d) => typeof d === "string" && d.length >= 10)
    .sort()
    .pop();

  const fetched = await fetchFromGoogleNews(latestArchivedDate);
  const newOnes = [];
  for (const item of fetched) {
    const norm = normaliseTitle(item.title);
    if (!norm || seenTitles.has(norm)) continue;
    seenTitles.add(norm);
    newOnes.push(item);
  }

  const combined = [...existing, ...newOnes].sort((a, b) =>
    (b.published_at || "").localeCompare(a.published_at || ""),
  );

  writeFileSync(ARCHIVE, JSON.stringify(combined, null, 2) + "\n", "utf8");

  console.log(
    `Press clippings: ${existing.length} existing, ${newOnes.length} new, ${combined.length} total`,
  );
})().catch((err) => {
  // Last-resort safety net: never fail the build.
  console.warn(`[press] unexpected error: ${err.message}`);
  process.exit(0);
});
