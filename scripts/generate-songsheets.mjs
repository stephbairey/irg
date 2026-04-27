#!/usr/bin/env node
// Generate a US-Letter PDF songsheet for every song in the WP CPT.
// Output: public/songsheets/<slug>.pdf
//
// Run standalone:  node scripts/generate-songsheets.mjs
// Runs as part of the build (prebuild hook in package.json).

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FONT_DIR = resolve(ROOT, "src/assets/fonts");
const OUT_DIR = resolve(ROOT, "public/songsheets");

// --- env -------------------------------------------------------------------

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
const GRAPHQL = env.PUBLIC_WP_GRAPHQL_ENDPOINT;
if (!GRAPHQL) {
  console.error("Missing PUBLIC_WP_GRAPHQL_ENDPOINT");
  process.exit(1);
}

// --- layout constants ------------------------------------------------------

const PAGE_W = 612; // 8.5 in × 72 dpi
const PAGE_H = 792; // 11 in × 72 dpi
const MARGIN = 72; // 1 in
const CONTENT_W = PAGE_W - 2 * MARGIN;
const CONTENT_X = MARGIN;
const CONTENT_TOP = PAGE_H - MARGIN;
const CONTENT_BOTTOM = MARGIN;

const TITLE_SIZE = 18;
const TUNE_SIZE = 11;
const BODY_SIZE = 13;
const META_SIZE = 9;

const TITLE_LH = 22;
const TUNE_LH = 14;
const BODY_LH = 18;
const META_LH = 12;

const META_RESERVE = META_LH * 4 + 16; // worst case: 4 lines of meta + a gap

// --- WP fetch --------------------------------------------------------------

async function fetchAllSongs() {
  const all = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const after = cursor ? `, after: "${cursor}"` : "";
    const q = `{
      songs(first: 100${after}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          title slug
          songDetails {
            lyrics
            dateWrittenOrUpdated
          }
          songwriters { nodes { name } }
          gaggles { nodes { name } }
          tunes { nodes { name } }
          issues { nodes { name } }
        }
      }
    }`;
    const res = await fetch(GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    const data = json.data.songs;
    all.push(...data.nodes);
    hasNext = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }
  return all;
}

// --- HTML → tokens ---------------------------------------------------------
// Each token is either { kind: "text", text, bold, italic, underline }
// or { kind: "br" }.

const ENTITY_MAP = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  ndash: "–", mdash: "—", hellip: "…",
};
function decodeEntities(s) {
  return s.replace(/&(#?\w+);/g, (_, code) => {
    if (code[0] === "#") {
      const n = code[1] === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    }
    return ENTITY_MAP[code] ?? "";
  });
}

function htmlToTokens(html) {
  const tokens = [];
  let i = 0;
  const stack = { bold: 0, italic: 0, underline: 0 };
  let buf = "";
  const STYLE_TAGS = {
    strong: "bold", b: "bold",
    em: "italic", i: "italic",
    u: "underline",
  };
  const BLOCK_TAGS = new Set(["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"]);

  function flush() {
    if (!buf) return;
    const text = decodeEntities(buf).replace(/\s+/g, " ");
    if (text) {
      tokens.push({
        kind: "text",
        text,
        bold: stack.bold > 0,
        italic: stack.italic > 0,
        underline: stack.underline > 0,
      });
    }
    buf = "";
  }

  while (i < html.length) {
    const ch = html[i];
    if (ch === "<") {
      const end = html.indexOf(">", i);
      if (end === -1) {
        buf += ch;
        i++;
        continue;
      }
      const raw = html.slice(i + 1, end).trim();
      i = end + 1;
      if (raw.startsWith("!--") || raw.startsWith("!") || raw.startsWith("?")) continue;
      const isClose = raw[0] === "/";
      const tagName = (isClose ? raw.slice(1) : raw).split(/[\s/>]/)[0].toLowerCase();
      if (!tagName) continue;

      if (tagName === "br") { flush(); tokens.push({ kind: "br" }); continue; }
      if (BLOCK_TAGS.has(tagName)) { flush(); tokens.push({ kind: "br" }); continue; }

      const styleKey = STYLE_TAGS[tagName];
      if (styleKey) {
        flush();
        if (isClose) stack[styleKey] = Math.max(0, stack[styleKey] - 1);
        else stack[styleKey] += 1;
        continue;
      }
      // Unknown tag — strip it but leave a separator so adjacent text doesn't merge.
      buf += " ";
    } else {
      buf += ch;
      i++;
    }
  }
  flush();

  // Collapse runs of <br> down to at most 2 (preserve verse breaks but no huge gaps).
  const collapsed = [];
  let brRun = 0;
  for (const t of tokens) {
    if (t.kind === "br") {
      brRun++;
      if (brRun <= 2) collapsed.push(t);
    } else {
      brRun = 0;
      collapsed.push(t);
    }
  }
  while (collapsed.length && collapsed[0].kind === "br") collapsed.shift();
  while (collapsed.length && collapsed[collapsed.length - 1].kind === "br") collapsed.pop();
  return collapsed;
}

// --- token stream → wrapped lines ------------------------------------------
// Output: array of "logical lines" of segments; a logical line maps to one
// rendered visual line after wrapping (we wrap inline below). Each entry is
// either { kind: "blank" } or { kind: "line", segments: [...] }.

function pickFont(fonts, bold, italic) {
  if (bold && italic) return fonts.boldItalic;
  if (bold) return fonts.bold;
  if (italic) return fonts.italic;
  return fonts.regular;
}

function wrapTokens(tokens, fonts, size, maxWidth) {
  // Step 1: split tokens into logical lines (separated by br).
  const logical = [[]];
  for (const t of tokens) {
    if (t.kind === "br") logical.push([]);
    else logical[logical.length - 1].push(t);
  }

  // Step 2: wrap each logical line.
  const out = [];
  for (const lineTokens of logical) {
    if (lineTokens.length === 0) {
      out.push({ kind: "blank" });
      continue;
    }
    const visualLines = [[]];
    let cur = visualLines[0];
    let curW = 0;
    for (const seg of lineTokens) {
      // Tokenize text into words and runs of whitespace.
      const parts = seg.text.match(/\S+|\s+/g) || [];
      for (const part of parts) {
        const isSpace = /^\s+$/.test(part);
        const f = pickFont(fonts, seg.bold, seg.italic);
        const w = f.widthOfTextAtSize(part, size);
        if (isSpace) {
          if (cur.length === 0) continue; // drop leading spaces
          cur.push({ ...seg, text: part, font: f, width: w, isSpace: true });
          curW += w;
        } else {
          if (curW + w > maxWidth && cur.length > 0) {
            // Trim trailing space on the line we're closing.
            while (cur.length && cur[cur.length - 1].isSpace) {
              curW -= cur.pop().width;
            }
            visualLines.push([]);
            cur = visualLines[visualLines.length - 1];
            curW = 0;
          }
          cur.push({ ...seg, text: part, font: f, width: w, isSpace: false });
          curW += w;
        }
      }
    }
    // Trim trailing whitespace from final visual line of this logical line.
    while (cur.length && cur[cur.length - 1].isSpace) cur.pop();
    for (const v of visualLines) {
      out.push({ kind: "line", segments: v });
    }
  }
  return out;
}

// --- rendering -------------------------------------------------------------

function newPage(doc) {
  const page = doc.addPage([PAGE_W, PAGE_H]);
  return { page, y: CONTENT_TOP };
}

function drawSegmentLine(page, segments, x, y, size, color) {
  let cursor = x;
  for (const s of segments) {
    if (!s.text) continue;
    page.drawText(s.text, { x: cursor, y, size, font: s.font, color });
    if (s.underline && !s.isSpace) {
      page.drawLine({
        start: { x: cursor, y: y - 1.5 },
        end: { x: cursor + s.width, y: y - 1.5 },
        thickness: 0.6,
        color,
      });
    }
    cursor += s.width;
  }
}

function buildMetaLines(song, fonts, size, maxWidth) {
  const parts = [];
  const sw = song.songwriters.nodes[0]?.name;
  const gg = song.gaggles.nodes[0]?.name;
  const issues = song.issues.nodes.map((i) => i.name);
  const date = song.songDetails.dateWrittenOrUpdated;
  if (sw) parts.push(`By ${sw}`);
  if (gg) parts.push(`${gg} Gaggle`);
  if (issues.length) parts.push(issues.join(", "));
  if (date) {
    try {
      const formatted = new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      parts.push(formatted);
    } catch {}
  }
  if (!parts.length) return [];
  // Pseudo-token list separated by middots; underline disabled for meta.
  const segs = [];
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) segs.push({ text: "  ·  ", bold: false, italic: false, underline: false });
    segs.push({ text: parts[i], bold: false, italic: false, underline: false });
  }
  // Reuse wrapping logic by treating these as a single logical line.
  return wrapTokens(
    segs.map((s) => ({ kind: "text", ...s })),
    fonts,
    size,
    maxWidth,
  ).filter((l) => l.kind === "line").map((l) => l.segments);
}

async function generatePdf(song, fonts) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  // Already loaded fonts are passed in as { regular, bold, italic, boldItalic }.
  // PDFDocument.embedFont returns a font scoped to that document, so we re-embed
  // here per song.
  const embedded = {
    regular: await doc.embedFont(fonts.regularBytes, { subset: true }),
    bold: await doc.embedFont(fonts.boldBytes, { subset: true }),
    italic: await doc.embedFont(fonts.italicBytes, { subset: true }),
    boldItalic: await doc.embedFont(fonts.boldItalicBytes, { subset: true }),
  };

  let { page, y } = newPage(doc);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  // Title (left-aligned, like a Word doc).
  const title = decodeEntities(song.title || "(untitled)");
  page.drawText(title, { x: CONTENT_X, y: y - TITLE_SIZE, size: TITLE_SIZE, font: embedded.bold, color: black });
  y -= TITLE_LH + 6;

  // Tune line (italic).
  const tune = song.tunes.nodes[0]?.name;
  if (tune) {
    const t = `Tune: ${decodeEntities(tune)}`;
    page.drawText(t, { x: CONTENT_X, y: y - TUNE_SIZE, size: TUNE_SIZE, font: embedded.italic, color: black });
    y -= TUNE_LH;
  }

  // Spacer before lyrics.
  y -= BODY_LH;

  // Lyrics.
  const tokens = htmlToTokens(song.songDetails.lyrics || "");
  const lines = wrapTokens(tokens, embedded, BODY_SIZE, CONTENT_W);

  for (const line of lines) {
    if (y - BODY_LH < CONTENT_BOTTOM) {
      ({ page, y } = newPage(doc));
    }
    if (line.kind === "blank") {
      y -= BODY_LH * 0.6;
      continue;
    }
    drawSegmentLine(page, line.segments, CONTENT_X, y - BODY_SIZE, BODY_SIZE, black);
    y -= BODY_LH;
  }

  // Metadata at bottom of last page (or new page if not enough room).
  const metaLines = buildMetaLines(song, embedded, META_SIZE, CONTENT_W);
  if (metaLines.length) {
    const metaHeight = metaLines.length * META_LH + 8;
    if (y - metaHeight < CONTENT_BOTTOM) {
      ({ page, y } = newPage(doc));
    }
    let metaY = CONTENT_BOTTOM + (metaLines.length - 1) * META_LH;
    for (const segs of metaLines) {
      drawSegmentLine(page, segs.map((s) => ({ ...s })), CONTENT_X, metaY, META_SIZE, gray);
      metaY -= META_LH;
    }
  }

  return await doc.save();
}

// --- main ------------------------------------------------------------------

(async () => {
  console.log("[songsheets] fetching songs from WPGraphQL…");
  const songs = await fetchAllSongs();
  console.log(`[songsheets] got ${songs.length} songs`);

  console.log("[songsheets] loading fonts…");
  const fontBytes = {
    regularBytes: readFileSync(resolve(FONT_DIR, "CrimsonText-Regular.ttf")),
    boldBytes: readFileSync(resolve(FONT_DIR, "CrimsonText-Bold.ttf")),
    italicBytes: readFileSync(resolve(FONT_DIR, "CrimsonText-Italic.ttf")),
    boldItalicBytes: readFileSync(resolve(FONT_DIR, "CrimsonText-BoldItalic.ttf")),
  };

  mkdirSync(OUT_DIR, { recursive: true });

  const start = Date.now();
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const song of songs) {
    const lyrics = song.songDetails?.lyrics;
    if (!lyrics || !lyrics.replace(/<[^>]*>/g, "").trim()) {
      skipped++;
      continue;
    }
    try {
      const bytes = await generatePdf(song, fontBytes);
      writeFileSync(resolve(OUT_DIR, `${song.slug}.pdf`), bytes);
      generated++;
    } catch (e) {
      failed++;
      console.warn(`[songsheets] FAIL ${song.slug}: ${(e instanceof Error ? e.message : e)}`);
    }
    if ((generated + skipped + failed) % 100 === 0) {
      console.log(`[songsheets] ${generated + skipped + failed}/${songs.length}…`);
    }
  }

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[songsheets] done in ${secs}s — generated ${generated}, skipped ${skipped} (no lyrics), failed ${failed}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
