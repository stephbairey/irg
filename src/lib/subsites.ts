export interface Subsite {
  id: number;
  slug: string;
  name: string;
  url: string;
  graphqlEndpoint: string;
}

const WP_URL = (import.meta.env.PUBLIC_WP_URL ?? "").replace(/\/$/, "");

interface SubsitePayload {
  id: number;
  slug: string;
  name: string;
  url: string;
}

export async function getSubsites(): Promise<Subsite[]> {
  if (!WP_URL) return [];

  const endpoint = `${WP_URL}/wp-json/irg/v1/subsites`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      console.warn(`[subsites] ${res.status} ${res.statusText} from ${endpoint}`);
      return [];
    }
    const sites = (await res.json()) as SubsitePayload[];
    if (!Array.isArray(sites)) {
      console.warn(`[subsites] unexpected response shape from ${endpoint}`);
      return [];
    }
    return sites
      .filter((s) => s && s.slug)
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name || s.slug,
        url: s.url || `${WP_URL}/${s.slug}`,
        graphqlEndpoint: `${s.url || `${WP_URL}/${s.slug}`}/graphql`,
      }));
  } catch (err) {
    console.warn(`[subsites] fetch failed: ${(err as Error).message}`);
    return [];
  }
}
