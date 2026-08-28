#!/usr/bin/env node
// List the homepage featured-song pool and its word counts, to help curate
// the "Feature on homepage" allowlist (D054). Read-only.
//
// Mirrors src/pages/index.astro: the eligibility filters fetchAllSongs()
// applies (drop duplicates, require a title, exclude central-hidden gaggles
// per D052 unless the song is homepage-flagged per D069) and the same
// stripHtml + word-count. There is no length window since D070; word counts
// are informational. Approved songs are listed first.
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
  const approved = !!s.feature_on_homepage;
  const hiddenGaggle = !!(s.gaggle && hidden.has(slugify(s.gaggle)));
  if (hiddenGaggle && !approved) continue;
  const lyrics = s.lyrics;
  if (!lyrics) continue;
  rows.push({
    slug: s.slug || slugify(s.title),
    title: s.title,
    gaggle: s.gaggle || "",
    songwriter: s.songwriter || "",
    words: wordCount(lyrics),
    approved: approved ? "yes" : "",
    hidden_gaggle_override: hiddenGaggle ? "yes" : "",
  });
}

rows.sort((a, b) => (b.approved > a.approved ? 1 : b.approved < a.approved ? -1 : 0) || a.words - b.words || a.title.localeCompare(b.title));

const csv = [
  "slug,title,gaggle,songwriter,words,approved,hidden_gaggle_override",
  ...rows.map((r) =>
    [r.slug, r.title, r.gaggle, r.songwriter, r.words, r.approved, r.hidden_gaggle_override]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  ),
].join("\n");
writeFileSync(OUT, csv + "\n");

const approved = rows.filter((r) => r.approved).length;
console.log(`${rows.length} eligible songs, ${approved} approved for the homepage`);
console.log(`Wrote ${OUT}`);
