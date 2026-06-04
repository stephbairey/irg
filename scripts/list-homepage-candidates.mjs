#!/usr/bin/env node
// List songs whose lyrics fall in the homepage featured-song length window, to
// help curate the "Feature on homepage" allowlist (D054). Read-only.
//
// Mirrors pickFeatured() in src/pages/index.astro exactly: same stripHtml +
// word-count, the same eligibility filters fetchAllSongs() applies (drop
// duplicates, require a title, exclude central-hidden gaggles like Seattle per
// D052), and the same length bands. Approval status is ignored — this is the
// pool you'd choose approvals FROM.
//
// Usage: node scripts/list-homepage-candidates.mjs
//   -> prints a summary and writes data/homepage-candidates.csv

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SONGS = resolve(ROOT, "data/songs-consolidated.json");
const HIDDEN = resolve(ROOT, "data/central-hidden-gaggles.json");
const OUT = resolve(ROOT, "data/homepage-candidates.csv");

// Tight band pickFeatured tries first; wider band is the fallback. The homepage
// will never feature a song outside the wider band.
const TIGHT = [175, 195];
const WIDE = [165, 205];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Verbatim copy of stripHtml() from src/pages/index.astro.
function stripHtml(html) {
  return html
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8217;|&#8216;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\b\/?(?:em|strong|p|br|b|i|u|span)>/gi, "")
    .replace(/&[a-z#0-9]+;/gi, "")
    .trim();
}
const wordCount = (html) => stripHtml(html).split(/\s+/).filter(Boolean).length;

const hidden = new Set();
if (existsSync(HIDDEN)) {
  for (const g of JSON.parse(readFileSync(HIDDEN, "utf8")).gaggles ?? []) hidden.add(slugify(g));
}

const songs = JSON.parse(readFileSync(SONGS, "utf8"));
const rows = [];
for (const s of songs) {
  if (!s || s.duplicate_of) continue;
  if (typeof s.title !== "string" || !s.title) continue;
  if (s.gaggle && hidden.has(slugify(s.gaggle))) continue;
  const lyrics = s.lyrics;
  if (!lyrics) continue;
  const wc = wordCount(lyrics);
  if (wc < WIDE[0] || wc > WIDE[1]) continue;
  rows.push({
    slug: s.slug || slugify(s.title),
    title: s.title,
    gaggle: s.gaggle || "",
    songwriter: s.songwriter || "",
    words: wc,
    band: wc >= TIGHT[0] && wc <= TIGHT[1] ? "tight" : "wide",
  });
}

rows.sort((a, b) => a.words - b.words || a.title.localeCompare(b.title));

const csv = [
  "slug,title,gaggle,songwriter,words,band",
  ...rows.map((r) =>
    [r.slug, r.title, r.gaggle, r.songwriter, r.words, r.band]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  ),
].join("\n");
writeFileSync(OUT, csv + "\n");

const tight = rows.filter((r) => r.band === "tight").length;
console.log(`Candidates in ${WIDE[0]}-${WIDE[1]} words: ${rows.length} (${tight} in the tight ${TIGHT[0]}-${TIGHT[1]} band)`);
console.log(`Wrote ${OUT}`);
