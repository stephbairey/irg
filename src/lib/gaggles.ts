import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface GaggleLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
}

const DATA = resolve(process.cwd(), "data/gaggle-locations.json");

// Cache one parse per build/dev process. Locations are static between deploys.
let cached: GaggleLocation[] | null = null;

export function getGaggleLocations(): GaggleLocation[] {
  if (cached) return cached;
  if (!existsSync(DATA)) {
    cached = [];
    return cached;
  }
  try {
    const raw = JSON.parse(readFileSync(DATA, "utf8"));
    cached = Array.isArray(raw)
      ? (raw.filter(
          (g) =>
            g &&
            typeof g.name === "string" &&
            typeof g.lat === "number" &&
            typeof g.lng === "number",
        ) as GaggleLocation[])
      : [];
  } catch {
    cached = [];
  }
  return cached;
}

export function getActiveGaggleCount(): number {
  return getGaggleLocations().length;
}
