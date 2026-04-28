#!/usr/bin/env node
// Fetch new "Raging Grannies" press clippings from The News API and merge them
// into data/press-clippings.json (the single source of truth for the Press page).
//
// Idempotent and failure-tolerant:
//   - Missing/invalid archive → starts fresh with [].
//   - Missing API key, network error, non-2xx, malformed payload → logs a
//     warning and exits 0. The build continues using whatever's already in
//     the archive.
//   - Dedupes by normalised title (lowercase, punctuation/whitespace stripped).
//
// Runs as part of `npm run prebuild` ahead of the songsheet generator.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ARCHIVE = resolve(ROOT, "data/press-clippings.json");

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  // process.env wins so CI / Cloudflare Pages env vars override .env.local
  return { ...env, ...process.env };
}

const env = loadEnv();
const API_KEY = env.THENEWSAPI_KEY;

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

function shapeArticle(raw) {
  const publishedAt = typeof raw.published_at === "string" ? raw.published_at.slice(0, 10) : null;
  if (!raw.title || !raw.url || !publishedAt) return null;
  return {
    title: String(raw.title).trim(),
    source: String(raw.source || "").trim(),
    url: String(raw.url),
    published_at: publishedAt,
    snippet: String(raw.snippet || raw.description || "").trim(),
    image_url: typeof raw.image_url === "string" && raw.image_url ? raw.image_url : null,
    fetched_at: todayIso(),
  };
}

async function fetchFromApi() {
  if (!API_KEY) {
    console.warn("[press] THENEWSAPI_KEY not set — skipping fetch (page renders from archive)");
    return [];
  }
  const url = `https://api.thenewsapi.com/v1/news/all?search=${encodeURIComponent("raging grannies")}&language=en&api_token=${encodeURIComponent(API_KEY)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[press] API returned ${res.status} ${res.statusText} — keeping existing archive. ${body.slice(0, 200)}`);
      return [];
    }
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    return data.map(shapeArticle).filter(Boolean);
  } catch (err) {
    console.warn(`[press] fetch failed: ${err.message} — keeping existing archive`);
    return [];
  }
}

(async () => {
  const existing = loadArchive();
  const seenTitles = new Set(existing.map((a) => normaliseTitle(a.title)));

  const fetched = await fetchFromApi();
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
