const WP_GRAPHQL_ENDPOINT = import.meta.env.PUBLIC_WP_GRAPHQL_ENDPOINT;

export async function wpQuery<T>({
  query,
  variables,
  endpoint = WP_GRAPHQL_ENDPOINT,
}: {
  query: string;
  variables?: Record<string, unknown>;
  endpoint?: string;
}): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      // Explicit headers — bare POSTs from Cloudflare Pages build workers
      // get rejected with 415 by some LiteSpeed/Nixihost configs.
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "User-Agent": "irg-build/1.0 (+https://raginggrannies.org)",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as { data: T; errors?: unknown[] };

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}
