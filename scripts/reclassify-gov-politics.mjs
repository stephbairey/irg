#!/usr/bin/env node
// Migration: split "Government & Politics" issue term into
// "Elections & Democracy" and "Government & Power".
//
// Dry run:   node scripts/reclassify-gov-politics.mjs
// Execute:   node scripts/reclassify-gov-politics.mjs --execute

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OLD_TERM_NAME = "Government & Politics";
const NEW_ED = "Elections & Democracy";
const NEW_GP = "Government & Power";
const DEFAULT_BUCKET = NEW_GP;

const ED_KEYWORDS = [
  "vote", "voter", "voters", "voting", "voted", "votes",
  "election", "elections", "electoral",
  "ballot", "ballots",
  "poll", "polls", "polling",
  "democracy", "democratic",
  "register", "registered", "registering", "registration",
  "gerrymander", "gerrymandering",
  "suffrage",
];

const GP_KEYWORDS = [
  "trump", "bush", "obama", "biden", "clinton", "reagan", "nixon", "cheney",
  "corruption", "corrupt",
  "congress", "congressional", "congressman", "congresswoman",
  "senate", "senator", "senators",
  "white house",
  "president", "presidential",
  "impeach", "impeachment", "impeached",
  "executive order",
  "capitol",
  "governor",
  "mayor",
  "oligarch", "oligarchs", "oligarchy",
  "dictator",
  "politician", "politicians",
];

const execute = process.argv.includes("--execute");
const sampleSize = 25;

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const BASE = env.PUBLIC_WP_URL?.replace(/\/$/, "");
const USER = env.WP_USERNAME;
const PASS = env.WP_APP_PASSWORD?.replace(/\s/g, "");

if (!BASE || !USER || !PASS) {
  console.error("Missing PUBLIC_WP_URL / WP_USERNAME / WP_APP_PASSWORD in .env.local");
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

async function wp(path, { method = "GET", body, query } = {}) {
  const qs = query ? "?" + new URLSearchParams(query).toString() : "";
  const url = `${BASE}/wp-json/wp/v2${path}${qs}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: AUTH,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${url} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return {
    json: await res.json(),
    totalPages: Number(res.headers.get("X-WP-TotalPages") ?? "1"),
    total: Number(res.headers.get("X-WP-Total") ?? "0"),
  };
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8217;|&#8216;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function buildRegex(words) {
  // Word-boundary match, case-insensitive. Phrase words like "white house"
  // use \b around the whole phrase which is fine since space is a boundary.
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(?:${escaped.join("|")})\\b`, "gi");
}

const ED_RE = buildRegex(ED_KEYWORDS);
const GP_RE = buildRegex(GP_KEYWORDS);

function classify(title, lyricsHtml) {
  const haystack = (title + " " + stripHtml(lyricsHtml)).toLowerCase();
  const edMatches = [...haystack.matchAll(ED_RE)].map((m) => m[0]);
  const gpMatches = [...haystack.matchAll(GP_RE)].map((m) => m[0]);
  const ed = edMatches.length > 0;
  const gp = gpMatches.length > 0;
  let buckets;
  if (ed && gp) buckets = [NEW_ED, NEW_GP];
  else if (ed) buckets = [NEW_ED];
  else if (gp) buckets = [NEW_GP];
  else buckets = [DEFAULT_BUCKET];
  return {
    buckets,
    edHits: [...new Set(edMatches)].slice(0, 5),
    gpHits: [...new Set(gpMatches)].slice(0, 5),
    defaulted: !ed && !gp,
  };
}

async function findTermBySlugOrName(name) {
  // WP auto-slugifies "Government & Politics" → "government-politics".
  const slug = name.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const bySlug = await wp("/issue", { query: { slug, per_page: "1" } });
  if (bySlug.json.length) return bySlug.json[0];
  const byName = await wp("/issue", { query: { search: name, per_page: "100" } });
  return byName.json.find((t) => t.name.toLowerCase() === name.toLowerCase()) || null;
}

async function ensureTerm(name) {
  const existing = await findTermBySlugOrName(name);
  if (existing) return existing;
  const created = await wp("/issue", { method: "POST", body: { name } });
  return created.json;
}

async function fetchAllSongsInTerm(termId) {
  const songs = [];
  let page = 1;
  while (true) {
    const res = await wp("/song", {
      query: {
        issue: String(termId),
        per_page: "100",
        page: String(page),
        context: "edit",
        _fields: "id,title,issue,acf",
        status: "publish,draft,pending,future,private",
      },
    });
    songs.push(...res.json);
    if (page >= res.totalPages || res.json.length === 0) break;
    page++;
  }
  return songs;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

(async () => {
  console.log(`Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);
  console.log(`WP: ${BASE}`);
  console.log("");

  console.log(`Looking up "${OLD_TERM_NAME}"…`);
  const oldTerm = await findTermBySlugOrName(OLD_TERM_NAME);
  if (!oldTerm) {
    console.error(`  Not found. Nothing to do.`);
    process.exit(1);
  }
  console.log(`  term_id=${oldTerm.id}  slug="${oldTerm.slug}"  count=${oldTerm.count}`);
  console.log("");

  console.log(`Fetching songs in "${OLD_TERM_NAME}"…`);
  const songsList = await fetchAllSongsInTerm(oldTerm.id);
  console.log(`  got ${songsList.length} songs`);
  console.log("");

  const songs = songsList.map((s) => ({
    id: s.id,
    title: typeof s.title === "object" ? (s.title.raw ?? s.title.rendered) : s.title,
    issueIds: s.issue || [],
    lyrics: s.acf?.lyrics || "",
  }));

  const results = songs.map((s) => ({ song: s, cls: classify(s.title, s.lyrics) }));

  const counts = { both: 0, edOnly: 0, gpOnly: 0, defaulted: 0 };
  for (const r of results) {
    if (r.cls.buckets.length === 2) counts.both++;
    else if (r.cls.buckets[0] === NEW_ED) counts.edOnly++;
    else if (!r.cls.defaulted) counts.gpOnly++;
    else counts.defaulted++;
  }

  console.log("Classification summary");
  console.log("----------------------");
  console.log(`  Elections & Democracy only : ${counts.edOnly}`);
  console.log(`  Government & Power only    : ${counts.gpOnly}`);
  console.log(`  Both buckets               : ${counts.both}`);
  console.log(`  Defaulted to G&P (no hits) : ${counts.defaulted}`);
  console.log(`  Total                      : ${results.length}`);
  console.log("");

  console.log(`Sample (first ${sampleSize}):`);
  console.log(`  ${pad("ID", 6)} ${pad("Title", 38)} ${pad("Buckets", 14)} Sample hits`);
  for (const r of results.slice(0, sampleSize)) {
    const b = r.cls.buckets.map((x) => x === NEW_ED ? "E&D" : "G&P").join("+");
    const hits = [
      r.cls.edHits.length ? "ed:" + r.cls.edHits.join(",") : null,
      r.cls.gpHits.length ? "gp:" + r.cls.gpHits.join(",") : null,
      r.cls.defaulted ? "(default)" : null,
    ].filter(Boolean).join("  ");
    console.log(`  ${pad(r.song.id, 6)} ${pad(r.song.title, 38)} ${pad(b, 14)} ${hits}`);
  }
  console.log("");

  if (!execute) {
    console.log("Dry run only. Re-run with --execute to write changes.");
    return;
  }

  console.log("Creating new terms if absent…");
  const edTerm = await ensureTerm(NEW_ED);
  const gpTerm = await ensureTerm(NEW_GP);
  console.log(`  ${NEW_ED} → id=${edTerm.id}`);
  console.log(`  ${NEW_GP} → id=${gpTerm.id}`);
  console.log("");

  console.log("Reclassifying songs…");
  const failures = [];
  let done = 0;
  for (const r of results) {
    try {
      const newIssueIds = new Set(r.song.issueIds.filter((id) => id !== oldTerm.id));
      for (const b of r.cls.buckets) {
        newIssueIds.add(b === NEW_ED ? edTerm.id : gpTerm.id);
      }
      await wp(`/song/${r.song.id}`, {
        method: "POST",
        body: { issue: [...newIssueIds] },
      });
    } catch (e) {
      failures.push({ id: r.song.id, title: r.song.title, err: e.message });
    }
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${results.length}`);
  }
  console.log(`  done (${done}, ${failures.length} failures)`);
  console.log("");

  if (failures.length) {
    console.log("Failures:");
    for (const f of failures.slice(0, 20)) {
      console.log(`  #${f.id} "${f.title}": ${f.err}`);
    }
    console.log("");
    console.error("Aborting before deleting old term. Fix failures and rerun.");
    process.exit(1);
  }

  console.log("Verifying: no songs remain in the old term…");
  const check = await wp("/song", {
    query: {
      issue: String(oldTerm.id),
      per_page: "1",
      context: "edit",
      _fields: "id",
      status: "publish,draft,pending,future,private",
    },
  });
  if (check.total !== 0) {
    console.error(`  ${check.total} songs still in old term. Aborting before deletion.`);
    process.exit(1);
  }
  console.log("  none remain");
  console.log("");

  console.log(`Deleting "${OLD_TERM_NAME}" (id=${oldTerm.id})…`);
  await wp(`/issue/${oldTerm.id}`, { method: "DELETE", query: { force: "true" } });
  console.log("  deleted");
  console.log("");

  console.log("Done.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
