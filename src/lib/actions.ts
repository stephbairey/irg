import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { wpQuery } from "./graphql";
import { getSubsites } from "./subsites";

export interface Action {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  link: string;
  gaggle: string;
  gaggleSlug: string;
}

interface PostsData {
  posts: {
    nodes: Array<{
      title: string;
      slug: string;
      date: string;
      excerpt: string;
      link: string;
    }>;
  };
}

const SNAPSHOT_PATH = resolve(process.cwd(), "data/actions.json");

function loadFromSnapshot(): Action[] | null {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as Action[];
    if (!Array.isArray(raw)) return null;
    return raw.filter((a) => a && typeof a.title === "string" && a.title.length > 0);
  } catch (err) {
    console.warn(`[actions] could not parse ${SNAPSHOT_PATH}: ${(err as Error).message}`);
    return null;
  }
}

async function fetchFromGraphQL(limit: number): Promise<Action[]> {
  const subsites = await getSubsites();
  if (subsites.length === 0) return [];

  const perSite = Math.max(limit, 3);

  const results = await Promise.all(
    subsites.map(async (site) => {
      try {
        const data = await wpQuery<PostsData>({
          endpoint: site.graphqlEndpoint,
          query: `{
            posts(first: ${perSite}, where: { orderby: { field: DATE, order: DESC } }) {
              nodes { title slug date excerpt link }
            }
          }`,
        });
        const gaggle = site.name.replace(/\s+Raging\s+Grannies\s*$/i, "").trim() || site.name;
        return data.posts.nodes.map((p) => ({
          ...p,
          gaggle,
          gaggleSlug: site.slug,
        }));
      } catch (err) {
        console.warn(
          `[actions] ${site.name} (${site.graphqlEndpoint}) failed: ${(err as Error).message}`,
        );
        return [];
      }
    }),
  );

  const all = results.flat();
  all.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return all.slice(0, limit);
}

export async function fetchLatestActions(limit = 3): Promise<Action[]> {
  // Prefer the committed snapshot — already sorted desc by snapshot-subsites.
  // Falls back to a live multi-subsite GraphQL query for local dev when the
  // snapshot is missing.
  const fromSnapshot = loadFromSnapshot();
  if (fromSnapshot && fromSnapshot.length > 0) {
    return fromSnapshot.slice(0, limit);
  }
  return fetchFromGraphQL(limit);
}
