const API_VERSION = "2026-07";

export interface ShopifyEnv {
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_ADMIN_API_TOKEN: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class ShopifyApiError extends Error {}

/**
 * Sends a query/mutation to the Shopify Admin GraphQL API and returns its
 * data payload. Throws ShopifyApiError on transport-level GraphQL errors —
 * callers still need to check each mutation's own userErrors array.
 */
export async function shopifyAdminRequest<T>(
  env: ShopifyEnv,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new ShopifyApiError(json.errors.map((e) => e.message).join("; "));
  }

  if (!json.data) {
    throw new ShopifyApiError("Shopify API returned no data");
  }

  return json.data;
}

interface UserError {
  field: string[] | null;
  message: string;
}

/** Joins a mutation's userErrors into a single message, or null if there were none. */
export function joinUserErrors(userErrors: UserError[]): string | null {
  if (userErrors.length === 0) {
    return null;
  }
  return userErrors.map((e) => e.message).join("; ");
}

interface CustomerLookup {
  id: string;
  note: string | null;
  tags: string[];
}

const FIND_CUSTOMER_QUERY = `
  query FindCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          note
          tags
        }
      }
    }
  }
`;

/** Looks up a customer by exact email match, returning null if none exists. */
export async function findCustomerByEmail(
  env: ShopifyEnv,
  email: string,
): Promise<CustomerLookup | null> {
  const data = await shopifyAdminRequest<{
    customers: { edges: { node: CustomerLookup }[] };
  }>(env, FIND_CUSTOMER_QUERY, { query: `email:${JSON.stringify(email)}` });

  return data.customers.edges[0]?.node ?? null;
}

/** Merges new tags into an existing tag list without duplicates. */
export function mergeTags(existing: string[], additions: string[]): string[] {
  return Array.from(new Set([...existing, ...additions]));
}

/** Appends a new note block to an existing customer note, if any. */
export function appendNote(existing: string | null, addition: string): string {
  return existing ? `${existing}\n\n---\n\n${addition}` : addition;
}
