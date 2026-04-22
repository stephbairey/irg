import { wpQuery } from "./graphql";

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

export async function fetchAllSongs(): Promise<Song[]> {
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
