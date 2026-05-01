#!/usr/bin/env node
// Generate public/llms.txt (curated dispatcher) and public/llms-full.txt
// (full corpus minus lyrics) at build time.
//
// Refs D038–D039. Lyrics excluded from llms-full.txt by design (D039) —
// agents fetch individual song pages or use L2 markdown twins / L4 MCP
// when they need lyrics, denying a free bulk-extraction surface.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SITE_URL = "https://raginggrannies.org";
const OUT_DIR = resolve(ROOT, "public");

const SONGS_PATH = resolve(ROOT, "data/songs-consolidated.json");
const GAGGLES_PATH = resolve(ROOT, "data/gaggle-locations.json");

// --- static page descriptions ------------------------------------------

const PAGES = [
  {
    path: "/songs/",
    title: "Song Library",
    desc: "Searchable archive of ~1,500 protest songs written by Raging Grannies worldwide. Filter by issue, gaggle, tune, or songwriter. Each song has a printable PDF songsheet.",
  },
  {
    path: "/find-a-gaggle/",
    title: "Find a Gaggle",
    desc: "Directory of all active Raging Grannies gaggles, organized by country and region, with a map.",
  },
  {
    path: "/start-a-gaggle/",
    title: "Start Your Own Gaggle",
    desc: "How to start a Raging Grannies gaggle in your community: gather a few committed women, pick your issues, write your songs (or borrow ours), put on a hat, and get out there.",
  },
  {
    path: "/about/",
    title: "About",
    desc: "Who the Raging Grannies are: women of a certain age subverting the sweet-little-old-lady stereotype to make activist noise about peace, justice, the environment, and human rights.",
  },
  {
    path: "/philosophy/",
    title: "Philosophy",
    desc: "Our approach: creative rage with humor, satire, song. Non-violent. Decentralized — no head office, no dues, no bylaws.",
  },
  {
    path: "/herstory/",
    title: "Herstory",
    desc: "Founded in Victoria, BC, Canada, 1987. The movement has spread to ~80 gaggles across North America and beyond.",
  },
  {
    path: "/faq/",
    title: "FAQ",
    desc: "Frequently asked questions: who can be a Granny, how gaggles organize, where the songs come from, what issues we sing about, and more.",
  },
  {
    path: "/in-the-news/",
    title: "In the News",
    desc: "Press coverage of the Raging Grannies, auto-fetched from news sources.",
  },
  {
    path: "/submit/",
    title: "Submit a Song",
    desc: "Song submissions are open to Raging Grannies. Submit details for a granny-only intake form.",
  },
  {
    path: "/contact/",
    title: "Contact",
    desc: "Questions about the international network, song library, or movement as a whole — route to the right Granny.",
  },
];

// FAQ summary — same shape as src/pages/faq.astro but compressed.
// (Hand-curated; if the page wording shifts, this won't drift dangerously
// because the corpus is descriptive, not normative.)
const FAQ = [
  {
    section: "Joining a Gaggle",
    qa: [
      ["Do I have to be a grandmother?", "No. \"Granny\" is a state of mind. You don't need grandchildren or any children — just to care about the world they're inheriting."],
      ["Can men join?", "Varies by gaggle. Most are women-only — there's power in subverting the sweet-little-old-lady stereotype, and that's part of why we're effective."],
      ["How do I find a gaggle near me?", "Check the map at /find-a-gaggle/. If there isn't one nearby, see /start-a-gaggle/."],
      ["Is there an age requirement?", "Most gaggles set 50 as the floor. The granny figure is a parody; what matters more is willingness to put on a hat and sing in public."],
    ],
  },
  {
    section: "How Gaggles Work",
    qa: [
      ["Is there a central organization?", "No, on purpose. Each gaggle is fully autonomous. The international network is deliberately disorganized — no dues, no bylaws, no central committee."],
      ["How do I start a gaggle?", "A few good women of a certain age, a shared sense of outrage, and willingness to sing in public. See /start-a-gaggle/ for the full guide."],
      ["Are there meetings? Officers?", "Most gaggles meet to rehearse and plan actions; how they organize is up to them. Decisions by consensus, free from hierarchy."],
      ["Do the Raging Grannies take donations?", "The international network does not. Most gaggles operate informally and self-fund. Support the issues we sing about."],
    ],
  },
  {
    section: "Songs and Performances",
    qa: [
      ["Where do the songs come from?", "We write them ourselves, set to familiar tunes (lullabies, hymns, pop songs, folk standards) so audiences pick up the melody and the satire lands."],
      ["Why parody songs instead of original music?", "Familiar tunes save rehearsal time. The contrast between a beloved tune and lyrics that name what nobody wants to name is what makes the joke work."],
      ["What's the song library?", "/songs/ — nearly 1,500 songs by Raging Grannies worldwide. Search by issue, gaggle, or tune. Every song has a printable songsheet."],
      ["Can I use a Raging Grannies song at my own event?", "Yes, with credit. Songs are part of an activist commons. Alter lyrics to fit your situation — that's the tradition."],
      ["Do you record albums or sell music?", "Mostly no. We're a live, in-public form; the songbook is the durable artifact."],
      ["How do I submit a song I wrote?", "Submissions are open to Raging Grannies only. See /submit/."],
    ],
  },
  {
    section: "Issues and Politics",
    qa: [
      ["What issues do you sing about?", "Whatever needs raging about. Peace and anti-militarism (founding issue), environment and climate, healthcare, reproductive rights, racism, economic inequality, ageism, and whatever else needs naming. Each gaggle picks its own focus."],
      ["Are you affiliated with a political party?", "No. We are not a political party and we are not affiliated with one. We take positions on issues, not personalities."],
      ["Are you affiliated with a religion?", "No. We come from many traditions and none."],
      ["Why \"Raging\"?", "Creative rage: deep compassion, concern for the future, willingness to confront with wit and perseverance. We rage because we care."],
      ["Do gaggles ever disagree with each other?", "Of course. Autonomous groups don't march in lockstep. Decisions by consensus across the network is the goal — when it doesn't happen, that's the network working as designed."],
    ],
  },
  {
    section: "Press and Getting Involved",
    qa: [
      ["I'm a journalist. Who do I contact?", "Specific gaggle? Reach out via their page. International network / songbook / movement-wide questions? See /contact/."],
      ["Can a gaggle perform at our event?", "Most gaggles will come if the issue aligns. Reach out to the nearest one. No booking fee; covering travel is appreciated. Activism with hats, not a polished concert."],
      ["I'm not a Granny but I want to support. What can I do?", "Show up to actions. Share songs and posts. Donate to local issues. Tell your friends."],
      ["Can I license a Raging Grannies photo or song?", "Photos belong to whoever took them. Songs are usually freely available for nonprofit and educational use with credit. For commercial use, contact the gaggle the song came from."],
    ],
  },
];

const HOWTO_START_GAGGLE = [
  "Gather a few good women: find committed women of a certain age in your community who share commitment to peace, social justice, environmental sustainability — and a sense of humor and outrage.",
  "Pick your issues: decide what you'll be raging about. Local issues, national issues, intersecting issues — your call.",
  "Write your songs (or borrow ours): set lyrics to familiar tunes that are simple to sing. Browse /songs/ for ones to adapt; alter freely to fit your situation.",
  "Sing it like you mean it: bring song sheets, sing clearly and loudly, make eye contact. Have one Granny lead the music and one to introduce songs.",
  "Dress the part: flowery hats, colorful shawls, aprons. Thrift shops are gold mines. The costume reads as the sweet-little-old-lady stereotype on purpose.",
  "Show up where it matters: street corners, farmers markets, rallies, town hall meetings, legislative hearings. Bring a banner and handouts about the issue.",
];

// --- helpers ------------------------------------------------------------

function loadSongs() {
  if (!existsSync(SONGS_PATH)) {
    console.warn(`[llms-txt] missing ${SONGS_PATH} — no songs in corpus`);
    return [];
  }
  const raw = JSON.parse(readFileSync(SONGS_PATH, "utf8"));
  return raw
    .filter((s) => s && !s.duplicate_of && s.title && (s.slug || s.title))
    .map((s) => ({
      title: s.title,
      slug: s.slug || slugifyFallback(s.title),
      tune: s.tune || "",
      songwriter: s.songwriter || "",
      gaggle: s.gaggle || "",
      issues: Array.isArray(s.issues) ? s.issues : [],
      url: `${SITE_URL}/songs/${s.slug || slugifyFallback(s.title)}/`,
    }));
}

function slugifyFallback(title) {
  return String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadGaggles() {
  if (!existsSync(GAGGLES_PATH)) {
    console.warn(`[llms-txt] missing ${GAGGLES_PATH} — no gaggle directory`);
    return [];
  }
  const raw = JSON.parse(readFileSync(GAGGLES_PATH, "utf8"));
  return Array.isArray(raw) ? raw : [];
}

// --- builders -----------------------------------------------------------

function buildLlmsTxt({ songs, gaggles }) {
  const songCount = songs.length;
  const gaggleCount = gaggles.length;
  const lines = [];

  lines.push("# International Raging Grannies");
  lines.push("");
  lines.push(
    "> Raging Grannies are activist singing groups using satire, parody songs, and creative protest to advocate for peace, justice, social and environmental change. Founded in Victoria, BC in 1987, the movement now has gaggles across the United States, Canada, and beyond.",
  );
  lines.push("");
  lines.push(`Songs in the library: ${songCount}. Active gaggles: ${gaggleCount}.`);
  lines.push("");

  lines.push("## Site sections");
  lines.push("");
  for (const p of PAGES) {
    lines.push(`- [${p.title}](${SITE_URL}${p.path}): ${p.desc}`);
  }
  lines.push("");

  lines.push("## For AI agents");
  lines.push("");
  lines.push(
    "- The full machine-readable corpus is at [llms-full.txt](" +
      SITE_URL +
      "/llms-full.txt) — gaggle directory, song catalog (titles + metadata, no lyrics), FAQ, organizational summaries.",
  );
  lines.push(
    "- For lyrics, fetch individual song pages at " +
      SITE_URL +
      "/songs/<slug>/ — each song page also exposes structured `MusicComposition` JSON-LD.",
  );
  lines.push(
    "- A read-only MCP server exposing structured queries over the song archive and gaggle directory is forthcoming at mcp.raginggrannies.org.",
  );
  lines.push("");

  lines.push("## Citation");
  lines.push("");
  lines.push(
    "Most songs are part of an activist commons — feel free to use, alter, and adapt for nonprofit and educational purposes with credit to the original gaggle. For commercial use, contact the gaggle the song came from.",
  );
  lines.push("");

  return lines.join("\n");
}

function buildLlmsFullTxt({ songs, gaggles }) {
  const lines = [];

  // -- header --
  lines.push("# International Raging Grannies — Full Corpus");
  lines.push("");
  lines.push(
    "> Activist singing groups using satire, parody songs, and creative protest. Founded Victoria, BC, 1987. ~" +
      gaggles.length +
      " gaggles across the United States, Canada, and beyond. " +
      songs.length +
      " songs in the song library.",
  );
  lines.push("");
  lines.push(
    "This file: gaggle directory, song catalog (metadata only — no lyrics), FAQ, organizational summaries. Lyrics: see " +
      SITE_URL +
      "/songs/<slug>/.",
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  // -- about / philosophy / herstory / etc. --
  for (const p of PAGES) {
    lines.push(`## ${p.title}`);
    lines.push("");
    lines.push(p.desc);
    lines.push("");
    lines.push(`Full page: ${SITE_URL}${p.path}`);
    lines.push("");
  }

  // -- how to start a gaggle (steps) --
  lines.push("## How to start a gaggle");
  lines.push("");
  for (let i = 0; i < HOWTO_START_GAGGLE.length; i++) {
    lines.push(`${i + 1}. ${HOWTO_START_GAGGLE[i]}`);
  }
  lines.push("");
  lines.push(`Full guide: ${SITE_URL}/start-a-gaggle/`);
  lines.push("");

  // -- FAQ --
  lines.push("## FAQ");
  lines.push("");
  for (const sec of FAQ) {
    lines.push(`### ${sec.section}`);
    lines.push("");
    for (const [q, a] of sec.qa) {
      lines.push(`**${q}**`);
      lines.push("");
      lines.push(a);
      lines.push("");
    }
  }

  // -- gaggle directory --
  lines.push("## Gaggle directory");
  lines.push("");
  const byCountry = {};
  for (const g of gaggles) {
    byCountry[g.country] ??= {};
    byCountry[g.country][g.region] ??= [];
    byCountry[g.country][g.region].push(g);
  }
  const countryOrder = ["United States", "Canada", "Israel"];
  const countries = Object.keys(byCountry).sort((a, b) => {
    const ai = countryOrder.indexOf(a);
    const bi = countryOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
  for (const country of countries) {
    lines.push(`### ${country}`);
    lines.push("");
    const regions = Object.keys(byCountry[country]).sort();
    for (const region of regions) {
      const list = byCountry[country][region]
        .map((g) => g.aka)
        .sort()
        .join(", ");
      lines.push(`- **${region}:** ${list}`);
    }
    lines.push("");
  }
  lines.push(`Find a gaggle map: ${SITE_URL}/find-a-gaggle/`);
  lines.push("");

  // -- song catalog grouped by issue --
  lines.push("## Song catalog");
  lines.push("");
  lines.push(
    `${songs.length} songs total. Lyrics not included — fetch individual pages at ${SITE_URL}/songs/<slug>/.`,
  );
  lines.push("");

  const byIssue = {};
  const noIssue = [];
  for (const s of songs) {
    if (s.issues.length === 0) {
      noIssue.push(s);
      continue;
    }
    for (const iss of s.issues) {
      byIssue[iss] ??= [];
      byIssue[iss].push(s);
    }
  }
  const issues = Object.keys(byIssue).sort();
  for (const iss of issues) {
    lines.push(`### ${iss}`);
    lines.push("");
    const list = byIssue[iss].slice().sort((a, b) => a.title.localeCompare(b.title));
    for (const s of list) {
      lines.push(formatSongLine(s));
    }
    lines.push("");
  }
  if (noIssue.length > 0) {
    lines.push("### Uncategorized");
    lines.push("");
    const list = noIssue.slice().sort((a, b) => a.title.localeCompare(b.title));
    for (const s of list) {
      lines.push(formatSongLine(s));
    }
    lines.push("");
  }

  // -- tune index --
  lines.push("## Tune index");
  lines.push("");
  lines.push("Tunes used by 5 or more songs (familiar melodies are reused often):");
  lines.push("");
  const tuneCounts = new Map();
  for (const s of songs) {
    if (!s.tune) continue;
    tuneCounts.set(s.tune, (tuneCounts.get(s.tune) || 0) + 1);
  }
  const popular = [...tuneCounts.entries()]
    .filter(([, c]) => c >= 5)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [tune, count] of popular) {
    lines.push(`- "${tune}" — ${count} songs`);
  }
  lines.push("");

  // -- footer --
  lines.push("## License");
  lines.push("");
  lines.push(
    "Most songs are part of an activist commons — freely available for nonprofit and educational use with credit. For commercial use, contact the gaggle the song came from. Photos and recordings belong to the gaggles or photographers who made them.",
  );
  lines.push("");

  return lines.join("\n");
}

function formatSongLine(s) {
  const parts = [];
  parts.push(`- [${s.title}](${s.url})`);
  if (s.tune) parts.push(`tune: ${s.tune}`);
  if (s.songwriter) parts.push(`by ${s.songwriter}`);
  if (s.gaggle) parts.push(s.gaggle);
  return parts.join(" · ");
}

// --- main --------------------------------------------------------------

(() => {
  const songs = loadSongs();
  const gaggles = loadGaggles();

  mkdirSync(OUT_DIR, { recursive: true });

  const llmsTxt = buildLlmsTxt({ songs, gaggles });
  const llmsFullTxt = buildLlmsFullTxt({ songs, gaggles });

  const llmsPath = resolve(OUT_DIR, "llms.txt");
  const fullPath = resolve(OUT_DIR, "llms-full.txt");
  writeFileSync(llmsPath, llmsTxt + "\n", "utf8");
  writeFileSync(fullPath, llmsFullTxt + "\n", "utf8");

  console.log(
    `[llms-txt] wrote ${llmsPath} (${(llmsTxt.length / 1024).toFixed(1)} KB)`,
  );
  console.log(
    `[llms-txt] wrote ${fullPath} (${(llmsFullTxt.length / 1024).toFixed(1)} KB) — ${songs.length} songs, ${gaggles.length} gaggles`,
  );
})();
