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

export async function fetchLatestActions(limit = 3): Promise<Action[]> {
  const subsites = getSubsites();
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
        return data.posts.nodes.map((p) => ({
          ...p,
          gaggle: site.name,
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
