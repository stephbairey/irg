#!/usr/bin/env node
// Build the RAG embedding index that powers the L3 "Ask the website"
// chatbot (D041). Runs locally — output is committed at data/embeddings.json
// (~3 MB) so CF Pages builds don't need a Cloudflare AI token at build time.
//
// Run:
//   node scripts/build-rag-index.mjs
//
// Requires CF_API_TOKEN and CF_ACCOUNT_ID in .env.local. The token needs
// the "Workers AI: Read" permission. Embedding model is bge-small-en-v1.5
// (384 dims), free under the 10k neurons/day Workers AI tier.
//
// Re-run when content changes (new songs in WP → run snapshot-songs.mjs
// first, then this script).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITE_URL = "https://raginggrannies.org";

const SONGS_PATH = resolve(ROOT, "data/songs-consolidated.json");
const GAGGLES_PATH = resolve(ROOT, "data/gaggle-locations.json");
// Output goes to public/ (not data/) so the file is in the static-asset
// build output and the chat endpoint can read it via env.ASSETS.fetch()
// at runtime. Astro copies public/* to dist/ unchanged.
const OUT_PATH = resolve(ROOT, "public/embeddings.json");

const MODEL = "@cf/baai/bge-small-en-v1.5";
const BATCH_SIZE = 20;
const LYRIC_EXCERPT_CHARS = 400;

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return { ...env, ...process.env };
}

const env = loadEnv();
const CF_TOKEN = env.CF_API_TOKEN;
const CF_ACCOUNT = env.CF_ACCOUNT_ID;
if (!CF_TOKEN || !CF_ACCOUNT) {
  console.error("[embed] missing CF_API_TOKEN or CF_ACCOUNT_ID in .env.local");
  console.error("[embed] generate the token at https://dash.cloudflare.com/profile/api-tokens with Workers AI: Read permission");
  process.exit(1);
}

// Strip HTML, decode common entities, collapse whitespace. Used to make a
// clean excerpt from WP-stored lyrics for embedding input.
function stripHtml(s) {
  if (!s) return "";
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z#0-9]+;/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyFallback(title) {
  return String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- chunk builders ----------------------------------------------------

function buildSongChunks() {
  if (!existsSync(SONGS_PATH)) {
    console.warn(`[embed] missing ${SONGS_PATH} — no song chunks`);
    return [];
  }
  const songs = JSON.parse(readFileSync(SONGS_PATH, "utf8"));
  return songs
    .filter((s) => s && !s.duplicate_of && s.title)
    .map((s) => {
      const slug = s.slug || slugifyFallback(s.title);
      const lyricExcerpt = stripHtml(s.lyrics).slice(0, LYRIC_EXCERPT_CHARS);
      const lines = [`"${s.title}"`];
      if (s.tune) lines.push(`Sung to the tune of "${s.tune}".`);
      if (s.songwriter) lines.push(`Written by ${s.songwriter}.`);
      if (s.gaggle) lines.push(`From the ${s.gaggle} gaggle.`);
      if (s.issues?.length) lines.push(`Issues: ${s.issues.join(", ")}.`);
      if (lyricExcerpt) lines.push(`Lyrics begin: ${lyricExcerpt}`);
      return {
        id: `song-${slug}`,
        type: "song",
        title: s.title,
        url: `${SITE_URL}/songs/${slug}/`,
        text: lines.join("\n"),
      };
    });
}

function buildGaggleChunks() {
  if (!existsSync(GAGGLES_PATH)) {
    console.warn(`[embed] missing ${GAGGLES_PATH} — no gaggle chunks`);
    return [];
  }
  const gaggles = JSON.parse(readFileSync(GAGGLES_PATH, "utf8"));
  return gaggles
    .filter((g) => g && g.aka && g.slug)
    .map((g) => ({
      id: `gaggle-${g.slug}`,
      type: "gaggle",
      title: g.aka,
      url: `${SITE_URL}/find-a-gaggle/#${g.slug}`,
      text: `${g.aka} — Raging Grannies based in ${g.region}, ${g.country}. Active gaggle in the international Raging Grannies network.`,
    }));
}

// Static page summaries — duplicated from scripts/generate-llms-txt.mjs;
// when the content there changes, sync here. (TODO: extract to shared module.)
const PAGES = [
  { path: "/songs/", title: "Song Library", desc: "Searchable archive of nearly 1,500 protest songs by Raging Grannies. Filter by issue, gaggle, tune, or songwriter. Each song has a printable PDF songsheet." },
  { path: "/find-a-gaggle/", title: "Find a Gaggle", desc: "Directory of all active Raging Grannies gaggles, organized by country and region, with a map." },
  { path: "/start-a-gaggle/", title: "Start Your Own Gaggle", desc: "How to start a Raging Grannies gaggle: gather a few committed women, pick your issues, write your songs, dress the part, and show up where it matters." },
  { path: "/about/", title: "About", desc: "Who the Raging Grannies are: women of a certain age subverting the sweet-little-old-lady stereotype to make activist noise about peace, justice, the environment, and human rights." },
  { path: "/philosophy/", title: "Philosophy", desc: "Our approach: creative rage with humor, satire, and song. Non-violent. Decentralized — no head office, no dues, no bylaws." },
  { path: "/herstory/", title: "Herstory", desc: "Founded in Victoria, BC in 1987. The Raging Grannies movement has spread to ~80 gaggles across North America and beyond." },
  { path: "/faq/", title: "FAQ", desc: "Frequently asked questions: who can be a Granny, how gaggles organize, where the songs come from, what issues we sing about." },
  { path: "/in-the-news/", title: "In the News", desc: "Press coverage of the Raging Grannies, auto-fetched from news sources." },
  { path: "/submit/", title: "Submit a Song", desc: "Song submissions are open to Raging Grannies. Submit a song you wrote for the central library." },
  { path: "/contact/", title: "Contact", desc: "Questions about the international network, song library, or movement as a whole." },
];

function buildPageChunks() {
  return PAGES.map((p) => ({
    id: `page-${slugifyFallback(p.path)}`,
    type: "page",
    title: p.title,
    url: `${SITE_URL}${p.path}`,
    text: `${p.title} — ${p.desc}`,
  }));
}

// FAQ — kept compact for embeddings, separate from site rendering.
const FAQ = [
  ["joining", "Do I have to be a grandmother?", "No. \"Granny\" is a state of mind. You don't need grandchildren or any children — just to care about the world they're inheriting."],
  ["joining", "Can men join?", "Varies by gaggle. Most are women-only — there's power in subverting the sweet-little-old-lady stereotype."],
  ["joining", "How do I find a gaggle near me?", "Check the map at /find-a-gaggle/. If there isn't one nearby, see /start-a-gaggle/."],
  ["joining", "Is there an age requirement?", "Most gaggles set 50 as the floor. The granny figure is a parody; what matters more is willingness to put on a hat and sing in public."],
  ["how-gaggles-work", "Is there a central organization?", "No, on purpose. Each gaggle is fully autonomous. The international network is deliberately disorganized — no dues, no bylaws, no central committee."],
  ["how-gaggles-work", "How do I start a gaggle?", "A few good women of a certain age, a shared sense of outrage, and willingness to sing in public. See /start-a-gaggle/."],
  ["how-gaggles-work", "Are there meetings? Officers?", "Most gaggles meet to rehearse and plan actions; how they organize is up to them. Decisions by consensus, free from hierarchy."],
  ["how-gaggles-work", "Do the Raging Grannies take donations?", "The international network does not. Most gaggles operate informally and self-fund."],
  ["songs", "Where do the songs come from?", "We write them ourselves, set to familiar tunes (lullabies, hymns, pop songs, folk standards) so audiences pick up the melody and the satire lands."],
  ["songs", "Why parody songs instead of original music?", "Familiar tunes save rehearsal time. The contrast between a beloved tune and lyrics that name what nobody wants to name is what makes the joke work."],
  ["songs", "What's the song library?", "/songs/ — nearly 1,500 songs by Raging Grannies worldwide. Search by issue, gaggle, or tune. Every song has a printable songsheet."],
  ["songs", "Can I use a Raging Grannies song at my own event?", "Yes, with credit. Songs are part of an activist commons. Alter lyrics to fit your situation — that's the tradition."],
  ["songs", "Do you record albums or sell music?", "Mostly no. We're a live, in-public form; the songbook is the durable artifact."],
  ["songs", "How do I submit a song I wrote?", "Submissions are open to Raging Grannies only. See /submit/."],
  ["issues", "What issues do you sing about?", "Whatever needs raging about. Peace and anti-militarism (the founding issue), environment and climate, healthcare, reproductive rights, racism, economic inequality, ageism, and whatever else needs naming."],
  ["issues", "Are you affiliated with a political party?", "No. We are not a political party and we are not affiliated with one. We take positions on issues, not personalities."],
  ["issues", "Are you affiliated with a religion?", "No. We come from many traditions and none."],
  ["issues", "Why \"Raging\"?", "Creative rage: deep compassion, concern for the future, willingness to confront with wit and perseverance. We rage because we care."],
  ["press", "I'm a journalist. Who do I contact?", "Specific gaggle? Reach out via their page. International network or movement-wide questions? See /contact/."],
  ["press", "Can a gaggle perform at our event?", "Most gaggles will come if the issue aligns. Reach out to the nearest one. No booking fee; covering travel is appreciated."],
  ["press", "I'm not a Granny but I want to support. What can I do?", "Show up to actions. Share songs. Donate to the local issues we sing about. Tell your friends."],
];

function buildFaqChunks() {
  return FAQ.map(([section, q, a], i) => ({
    id: `faq-${section}-${i}`,
    type: "faq",
    title: q,
    url: `${SITE_URL}/faq/`,
    text: `Q: ${q}\nA: ${a}`,
  }));
}

// --- embedding ----------------------------------------------------------

async function embedBatch(texts) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/ai/run/${MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: texts }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Workers AI ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`Workers AI errors: ${JSON.stringify(json.errors)}`);
  }
  // shape: { result: { shape: [N, 384], data: [[...], [...]] } }
  return json.result.data;
}

// Round to 6 significant digits to keep embeddings.json compact (~3-4 MB
// instead of ~9 MB at full precision). Cosine similarity is unaffected at
// this precision level.
function roundFloats(arr, sigFigs = 6) {
  return arr.map((v) => Number(v.toPrecision(sigFigs)));
}

// --- main ---------------------------------------------------------------

(async () => {
  const chunks = [
    ...buildPageChunks(),
    ...buildFaqChunks(),
    ...buildGaggleChunks(),
    ...buildSongChunks(),
  ];

  const counts = chunks.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`[embed] built ${chunks.length} chunks: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ")}`);

  const records = [];
  const start = Date.now();
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const embeddings = await embedBatch(batch.map((c) => c.text));
    for (let j = 0; j < batch.length; j++) {
      records.push({
        id: batch[j].id,
        type: batch[j].type,
        title: batch[j].title,
        url: batch[j].url,
        text: batch[j].text,
        embedding: roundFloats(embeddings[j]),
      });
    }
    process.stdout.write(`\r[embed] ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}…`);
  }
  process.stdout.write("\n");

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  writeFileSync(OUT_PATH, JSON.stringify(records) + "\n", "utf8");
  const sizeKb = (readFileSync(OUT_PATH).length / 1024).toFixed(0);
  console.log(`[embed] wrote ${records.length} embeddings to ${OUT_PATH} (${sizeKb} KB) in ${elapsed}s`);
})();
