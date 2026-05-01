#!/usr/bin/env node
// Snapshot all songs from the live WPGraphQL endpoint into
// data/songs-consolidated.json. Replaces the migration-era consolidated
// JSON with a fresh dump that reflects the current state of the WP CPT —
// including WP-assigned slugs (so my code stops needing to derive them
// from titles) and any edits made in WP admin since the last snapshot.
//
// Run locally where the WP origin doesn't bot-block your IP:
//   node scripts/snapshot-songs.mjs
//
// Output shape matches the existing data/songs-consolidated.json so
// src/lib/songs.ts and scripts/generate-songsheets.mjs continue working
// unchanged. New: each record carries an explicit `slug` field.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

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
  console.error("Missing PUBLIC_WP_GRAPHQL_ENDPOINT (set in .env.local)");
  process.exit(1);
}

const SONG_FIELDS = `
  databaseId
  title
  slug
  date
  songDetails {
    lyrics
    keyOrStartingNote
    youtubeLink
    youtubeLink2
    dateWrittenOrUpdated
    sourceNotes
  }
  issues { nodes { name } }
  songwriters { nodes { name } }
  gaggles { nodes { name } }
  tunes { nodes { name } }
`;

async function fetchAllSongs() {
  const all = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const after = cursor ? `, after: "${cursor}"` : "";
    const query = `{
      songs(first: 100${after}) {
        pageInfo { hasNextPage endCursor }
        nodes { ${SONG_FIELDS} }
      }
    }`;
    const res = await fetch(GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "User-Agent": "irg-build/1.0 (+https://raginggrannies.org)",
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status} ${res.statusText}`);
    const json = await res.json();
    if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    if (!json.data?.songs) {
      throw new Error(`Missing data.songs — got: ${JSON.stringify(json).slice(0, 300)}`);
    }
    all.push(...json.data.songs.nodes);
    hasNext = json.data.songs.pageInfo.hasNextPage;
    cursor = json.data.songs.pageInfo.endCursor;
    process.stdout.write(`\r[snapshot] fetched ${all.length} songs…`);
  }
  process.stdout.write("\n");
  return all;
}

// Flatten taxonomy nodes to a single string. Multi-entry → " and "-joined,
// matching the consolidated JSON's historical convention.
function joinNodes(connection, sep = " and ") {
  const names = (connection?.nodes ?? [])
    .map((n) => (n?.name ?? "").trim())
    .filter(Boolean);
  return names.join(sep);
}

function toRecord(node) {
  const sd = node.songDetails ?? {};
  return {
    id: `wp-${node.databaseId}`,
    source: "wp",
    original_wp_id: node.databaseId,
    title: node.title ?? "",
    slug: node.slug ?? "",
    lyrics: sd.lyrics ?? "",
    tune: joinNodes(node.tunes, " / "),
    songwriter: joinNodes(node.songwriters, " and "),
    gaggle: joinNodes(node.gaggles, ", "),
    issues: (node.issues?.nodes ?? []).map((n) => n.name).filter(Boolean),
    key_or_starting_note: sd.keyOrStartingNote ?? "",
    youtube_link: sd.youtubeLink ?? "",
    youtube_link_2: sd.youtubeLink2 ?? "",
    date_written_or_updated: sd.dateWrittenOrUpdated ?? "",
    date_published: (node.date ?? "").slice(0, 10),
    source_notes: sd.sourceNotes ?? "",
    duplicate_of: null,
    needs_review: false,
    review_notes: "",
  };
}

(async () => {
  console.log(`[snapshot] querying ${GRAPHQL}`);
  const nodes = await fetchAllSongs();
  console.log(`[snapshot] received ${nodes.length} songs`);

  const records = nodes.map(toRecord);

  // Dedupe by slug (defensive — WP guarantees unique slugs, but check anyway).
  const slugSeen = new Map();
  for (const r of records) {
    if (slugSeen.has(r.slug)) {
      console.warn(`[snapshot] slug collision: "${r.slug}" used by ${slugSeen.get(r.slug)} and ${r.id}`);
    } else {
      slugSeen.set(r.slug, r.id);
    }
  }

  const outPath = resolve(ROOT, "data/songs-consolidated.json");
  writeFileSync(outPath, JSON.stringify(records, null, 2) + "\n", "utf8");
  console.log(`[snapshot] wrote ${records.length} records to ${outPath}`);
})();
