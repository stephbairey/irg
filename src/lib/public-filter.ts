/**
 * Shared publish-status gate for the agent layer (D046).
 *
 * Single audit point for what content is allowed into the consolidated
 * JSONs, llms-full.txt, RAG embeddings, and MCP responses. The JS
 * password gate on members-only WP pages keeps casual visitors out;
 * this filter prevents members-only content from reaching aggregated
 * agent surfaces that any scraper could read with no JS execution.
 *
 * **All four agent layers (L1–L4) import this module.** Adding a new
 * agent surface? Route it through here, or audit-document why not.
 *
 * Today: songs come pre-filtered from WPGraphQL (publish-only by default
 * via the GraphQL `songs` query) so the filter is a no-op for them. The
 * module exists as the canonical guard for L2 markdown twins, L3 RAG
 * embeddings, and L4 MCP responses, all of which will ingest multi-
 * source content where members-only categories are a real concern
 * (subsite Action posts, gaggle pages with private metadata, etc.).
 */

const DENYLISTED_CATEGORIES = new Set<string>([
  "members-only",
  "draft-public",
]);

export interface PublicGuardable {
  status?: string;
  categories?: string[] | { nodes: Array<{ slug: string }> };
}

/**
 * Returns true if the record is safe to expose on the agent layer.
 *
 * - `status` (when present) must be exactly `"publish"`.
 * - No category in the record may match the denylist (currently
 *   `members-only` and `draft-public`).
 *
 * Records without a `status` field are considered publish-eligible —
 * the WPGraphQL `songs` query already pre-filters by status, so there's
 * no `status` field on snapshot records by default.
 */
export function isPublic(record: PublicGuardable): boolean {
  if (record.status !== undefined && record.status !== "publish") return false;
  const cats: string[] = Array.isArray(record.categories)
    ? record.categories
    : (record.categories?.nodes ?? []).map((n) => n.slug);
  if (cats.some((c) => DENYLISTED_CATEGORIES.has(c))) return false;
  return true;
}

/**
 * Filter an array of records to only those `isPublic` allows.
 */
export function filterPublic<T extends PublicGuardable>(records: T[]): T[] {
  return records.filter(isPublic);
}

/**
 * The denylist of category slugs that exclude a record from the agent
 * layer. Exported so other consumers (e.g. WP-side endpoints) can keep
 * their guards in sync with the same source of truth.
 */
export const PUBLIC_DENYLIST: readonly string[] = Object.freeze(
  Array.from(DENYLISTED_CATEGORIES),
);
