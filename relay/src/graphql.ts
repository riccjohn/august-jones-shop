import { type TokenManager, UPSTREAM_TIMEOUT_MS } from "./token";

// Kept in lockstep with functions/api/_lib/shopify.ts's own API_VERSION
// constant — this is the relay-mode path and that is the direct-call
// (rollback) path. They are separate tsconfig projects and cannot share an
// import, so the invariant is enforced by
// relay/src/__tests__/api-version-lockstep.test.ts. Change both together.
const API_VERSION = "2026-07";

export interface GraphqlEnv {
  SHOPIFY_STORE_DOMAIN: string;
}

export interface GraphqlRequestBody {
  query: string;
  variables?: Record<string, unknown>;
}

export interface GraphqlForwardResult {
  status: number;
  body: string;
  contentType: string | null;
}

async function callShopify(
  env: GraphqlEnv,
  token: string,
  body: GraphqlRequestBody,
): Promise<Response> {
  return fetch(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify(body),
      // A fresh signal per call, not a shared one: the 401 path below issues
      // a second request, and a reused timeout would already be spent.
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    },
  );
}

export async function forwardGraphqlRequest(
  env: GraphqlEnv,
  tokenManager: TokenManager,
  body: GraphqlRequestBody,
): Promise<GraphqlForwardResult> {
  const token = await tokenManager.getToken();
  let response = await callShopify(env, token, body);

  if (response.status === 401) {
    tokenManager.invalidate();
    const retryToken = await tokenManager.getToken();
    response = await callShopify(env, retryToken, body);
  }

  const text = await response.text();
  return {
    status: response.status,
    body: text,
    contentType: response.headers.get("content-type"),
  };
}
