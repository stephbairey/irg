export interface Subsite {
  slug: string;
  name: string;
  graphqlEndpoint: string;
  baseUrl: string;
}

const WP_URL = (import.meta.env.PUBLIC_WP_URL ?? "").replace(/\/$/, "");
const RAW = (import.meta.env.PUBLIC_WP_SUBSITES ?? "") as string;

export function getSubsites(): Subsite[] {
  if (!WP_URL || !RAW) return [];

  return RAW.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const colon = entry.indexOf(":");
      const slug = (colon === -1 ? entry : entry.slice(0, colon)).trim();
      const name = colon === -1 ? slug : entry.slice(colon + 1).trim() || slug;
      return {
        slug,
        name,
        graphqlEndpoint: `${WP_URL}/${slug}/graphql`,
        baseUrl: `${WP_URL}/${slug}/`,
      };
    })
    .filter((s) => s.slug);
}
