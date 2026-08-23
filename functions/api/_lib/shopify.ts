const API_VERSION = "2026-07";

export interface ShopifyEnv {
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_CLIENT_ID: string;
  SHOPIFY_CLIENT_SECRET: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class ShopifyApiError extends Error {}

/**
 * A non-JSON response from Shopify. Shopify's edge intermittently challenges
 * the first request from an unfamiliar origin (e.g. a Cloudflare Pages
 * Function invocation) with an HTML bot-check page instead of a real API
 * response; retrying almost always succeeds since the challenge doesn't
 * reproduce on the next attempt.
 */
export class NonJsonShopifyResponseError extends ShopifyApiError {}

interface AccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses a fetch Response as JSON, surfacing a readable error (status code +
 * body snippet) instead of a cryptic "Unexpected token '<'" if Shopify
 * returns an HTML error page instead of JSON.
 */
async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new NonJsonShopifyResponseError(
      `Shopify returned a non-JSON response (status ${response.status}): ${text.slice(0, 200)}`,
    );
  }
}

/**
 * Fetches from Shopify and parses the response as JSON, retrying if Shopify
 * responds with a non-JSON bot-challenge page (see NonJsonShopifyResponseError).
 */
async function fetchShopifyJson<T>(url: string, init: RequestInit): Promise<T> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    const response = await fetch(url, init);
    try {
      return await parseJsonResponse<T>(response);
    } catch (err) {
      if (!(err instanceof NonJsonShopifyResponseError)) throw err;
      if (attempt === RETRY_ATTEMPTS) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new ShopifyApiError("unreachable");
}

/**
 * Exchanges the custom app's client credentials for an Admin API access
 * token. As of Shopify's January 2026 Dev Dashboard app model, custom apps
 * no longer expose a static token — this grant must be requested fresh
 * (tokens expire after 24h, so we just fetch one per request instead of
 * caching across stateless edge invocations).
 */
async function fetchAccessToken(env: ShopifyEnv): Promise<string> {
  const json = await fetchShopifyJson<AccessTokenResponse>(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: env.SHOPIFY_CLIENT_ID,
        client_secret: env.SHOPIFY_CLIENT_SECRET,
      }).toString(),
    },
  );

  if (!json.access_token) {
    throw new ShopifyApiError(
      json.error_description ??
        json.error ??
        "Failed to obtain a Shopify access token",
    );
  }

  return json.access_token;
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

export interface ShopifyClient {
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  findCustomerByEmail(email: string): Promise<CustomerLookup | null>;
}

/** Fetches a fresh access token and returns a client bound to it for this request. */
export async function createShopifyClient(
  env: ShopifyEnv,
): Promise<ShopifyClient> {
  const accessToken = await fetchAccessToken(env);

  async function request<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const json = await fetchShopifyJson<GraphQLResponse<T>>(
      `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
      },
    );

    if (json.errors && json.errors.length > 0) {
      throw new ShopifyApiError(json.errors.map((e) => e.message).join("; "));
    }

    if (!json.data) {
      throw new ShopifyApiError("Shopify API returned no data");
    }

    return json.data;
  }

  async function findCustomerByEmail(
    email: string,
  ): Promise<CustomerLookup | null> {
    const data = await request<{
      customers: { edges: { node: CustomerLookup }[] };
    }>(FIND_CUSTOMER_QUERY, { query: `email:${JSON.stringify(email)}` });

    return data.customers.edges[0]?.node ?? null;
  }

  return { request, findCustomerByEmail };
}

/** Merges new tags into an existing tag list without duplicates. */
export function mergeTags(existing: string[], additions: string[]): string[] {
  return Array.from(new Set([...existing, ...additions]));
}

/** Appends a new note block to an existing customer note, if any. */
export function appendNote(existing: string | null, addition: string): string {
  return existing ? `${existing}\n\n---\n\n${addition}` : addition;
}
