import { wpQuery } from "./graphql";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Song {
  title: string;
  slug: string;
  date: string;
  songDetails: {
    lyrics: string | null;
    keyOrStartingNote: string | null;
    youtubeLink: string | null;
    youtubeLink2: string | null;
    dateWrittenOrUpdated: string | null;
    sourceNotes: string | null;
  };
  issues: { nodes: { name: string }[] };
  songwriters: { nodes: { name: string }[] };
  gaggles: { nodes: { name: string }[] };
  tunes: { nodes: { name: string }[] };
}

interface SongsPage {
  songs: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Song[];
  };
}

interface ConsolidatedRecord {
  id: string;
  title: string;
  lyrics: string;
  tune: string;
  songwriter: string;
  gaggle: string;
  issues: string[];
  key_or_starting_note: string;
  youtube_link: string;
  youtube_link_2: string;
  date_written_or_updated: string;
  date_published: string;
  source_notes: string;
  duplicate_of: string | null;
}

const SONG_FIELDS = `
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

const CONSOLIDATED_PATH = resolve(process.cwd(), "data/songs-consolidated.json");

// Match WordPress sanitize_title() for the slug fields the live CPT exposes.
// ASCII-fold via Unicode normalization, lowercase, collapse non-alphanumerics
// to a single hyphen. Verified against 1,493 built song pages.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullIfEmpty(s: string | null | undefined): string | null {
  return s ? s : null;
}

function consolidatedToSong(r: ConsolidatedRecord): Song {
  return {
    title: r.title,
    slug: slugify(r.title),
    date: r.date_published || r.date_written_or_updated || "",
    songDetails: {
      lyrics: nullIfEmpty(r.lyrics),
      keyOrStartingNote: nullIfEmpty(r.key_or_starting_note),
      youtubeLink: nullIfEmpty(r.youtube_link),
      youtubeLink2: nullIfEmpty(r.youtube_link_2),
      dateWrittenOrUpdated: nullIfEmpty(r.date_written_or_updated),
      sourceNotes: nullIfEmpty(r.source_notes),
    },
    issues: { nodes: (r.issues ?? []).map((name) => ({ name })) },
    songwriters: { nodes: r.songwriter ? [{ name: r.songwriter }] : [] },
    gaggles: { nodes: r.gaggle ? [{ name: r.gaggle }] : [] },
    tunes: { nodes: r.tune ? [{ name: r.tune }] : [] },
  };
}

function loadFromJson(): Song[] | null {
  if (!existsSync(CONSOLIDATED_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(CONSOLIDATED_PATH, "utf8")) as ConsolidatedRecord[];
    if (!Array.isArray(raw)) return null;
    return raw
      .filter((r) => r && !r.duplicate_of && typeof r.title === "string" && r.title.length > 0)
      .map(consolidatedToSong);
  } catch (err) {
    console.warn(`[songs] could not parse ${CONSOLIDATED_PATH}: ${(err as Error).message}`);
    return null;
  }
}

// Module-level cache: fetchAllSongs paginates through ~1500 songs and is the
// hottest call on the build (home, /songs/, /songs/by-issue/, /songs/by-tune/,
// every /songs/[slug] page generation, etc). One process = one fetch.
let cachedAll: Promise<Song[]> | null = null;

export function fetchAllSongs(): Promise<Song[]> {
  if (!cachedAll) cachedAll = fetchAllSongsImpl();
  return cachedAll;
}

async function fetchAllSongsImpl(): Promise<Song[]> {
  // Prefer the committed consolidated corpus — it's the durable source of
  // truth and works where WPGraphQL isn't reachable (CF Pages preview behind
  // Imunify360 bot-protection on shared hosting). Fall back to live WPGraphQL
  // for local dev when the JSON is absent or malformed.
  const fromJson = loadFromJson();
  if (fromJson && fromJson.length > 0) {
    return fromJson;
  }
  console.warn(
    "[songs] data/songs-consolidated.json missing or empty — falling back to WPGraphQL",
  );
  return fetchAllSongsFromGraphQL();
}

async function fetchAllSongsFromGraphQL(): Promise<Song[]> {
  const all: Song[] = [];
  let hasNext = true;
  let cursor: string | null = null;

  while (hasNext) {
    const afterArg = cursor ? `, after: "${cursor}"` : "";
    const data = await wpQuery<SongsPage>({
      query: `query AllSongs {
        songs(first: 100${afterArg}) {
          pageInfo { hasNextPage endCursor }
          nodes { ${SONG_FIELDS} }
        }
      }`,
    });

    all.push(...data.songs.nodes);
    hasNext = data.songs.pageInfo.hasNextPage;
    cursor = data.songs.pageInfo.endCursor;
  }

  return all;
}

export async function fetchSongBySlug(slug: string): Promise<Song | null> {
  const data = await wpQuery<{ song: Song | null }>({
    query: `query SongBySlug($slug: ID!) {
      song(id: $slug, idType: SLUG) {
        ${SONG_FIELDS}
      }
    }`,
    variables: { slug },
  });

  return data.song;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  let videoId: string | null = null;

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);

    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (
      parsed.hostname.includes("youtube.com") &&
      parsed.searchParams.has("v")
    ) {
      videoId = parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}
