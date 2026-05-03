import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Subsite {
  id: number;
  slug: string;
  name: string;
  url: string;
  graphqlEndpoint: string;
}

const WP_URL = (import.meta.env.PUBLIC_WP_URL ?? "").replace(/\/$/, "");
const SNAPSHOT_PATH = resolve(process.cwd(), "data/subsites.json");

interface SubsitePayload {
  id: number;
  slug: string;
  name: string;
  url: string;
}

function withGraphql(s: SubsitePayload): Subsite {
  const url = (s.url || `${WP_URL}/${s.slug}`).replace(/\/$/, "");
  return {
    id: s.id,
    slug: s.slug,
    name: s.name || s.slug,
    url,
    graphqlEndpoint: `${url}/graphql`,
  };
}

function loadFromSnapshot(): Subsite[] | null {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as SubsitePayload[];
    if (!Array.isArray(raw)) return null;
    return raw.filter((s) => s && s.slug).map(withGraphql);
  } catch (err) {
    console.warn(`[subsites] could not parse ${SNAPSHOT_PATH}: ${(err as Error).message}`);
    return null;
  }
}

async function fetchFromWp(): Promise<Subsite[]> {
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
    return sites.filter((s) => s && s.slug).map(withGraphql);
  } catch (err) {
    console.warn(`[subsites] fetch failed: ${(err as Error).message}`);
    return [];
  }
}

export async function getSubsites(): Promise<Subsite[]> {
  // Prefer the committed snapshot — works in CF Pages builds where the WP
  // origin is bot-blocked. Fall back to live REST for local dev or when the
  // snapshot is missing.
  const fromSnapshot = loadFromSnapshot();
  if (fromSnapshot && fromSnapshot.length > 0) return fromSnapshot;
  return fetchFromWp();
}
