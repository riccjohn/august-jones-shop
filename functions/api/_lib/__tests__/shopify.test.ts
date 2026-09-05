import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createShopifyClient,
  NonJsonShopifyResponseError,
  ShopifyApiError,
  type ShopifyEnv,
} from "../shopify";

const env: ShopifyEnv = {
  SHOPIFY_STORE_DOMAIN: "test-shop.myshopify.com",
  SHOPIFY_CLIENT_ID: "client-id",
  SHOPIFY_CLIENT_SECRET: "client-secret",
};

const BOT_CHALLENGE_HTML =
  "<!DOCTYPE html><html><head><title>Verifying your connection...</title></head></html>";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function htmlChallengeResponse(): Response {
  return new Response(BOT_CHALLENGE_HTML, { status: 403 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("createShopifyClient — token exchange retry", () => {
  it("retries the token exchange once after a non-JSON (bot-challenge) response, then succeeds", async () => {
    vi.useFakeTimers();
    let tokenCallCount = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      if (url.toString().includes("/admin/oauth/access_token")) {
        tokenCallCount++;
        return tokenCallCount === 1
          ? htmlChallengeResponse()
          : jsonResponse({ access_token: "test-token" });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultPromise = createShopifyClient(env);
    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBeDefined();
    expect(tokenCallCount).toBe(2);
  });
});

describe("ShopifyClient.request — GraphQL request retry", () => {
  it("retries a GraphQL request once after a non-JSON (bot-challenge) response, then succeeds", async () => {
    let graphqlCallCount = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        return jsonResponse({ access_token: "test-token" });
      }
      if (urlStr.includes("/admin/api/")) {
        graphqlCallCount++;
        return graphqlCallCount === 1
          ? htmlChallengeResponse()
          : jsonResponse({ data: { ok: true } });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = await createShopifyClient(env);

    vi.useFakeTimers();
    const requestPromise = client.request("query { ok }");
    await vi.runAllTimersAsync();

    await expect(requestPromise).resolves.toEqual({
      ok: true,
    });
    expect(graphqlCallCount).toBe(2);
  });

  it("throws the non-JSON error after exhausting all retry attempts", async () => {
    let graphqlCallCount = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        return jsonResponse({ access_token: "test-token" });
      }
      if (urlStr.includes("/admin/api/")) {
        graphqlCallCount++;
        return htmlChallengeResponse();
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = await createShopifyClient(env);

    vi.useFakeTimers();
    const requestPromise = client.request("query { ok }");
    // Attach the rejection assertion before advancing timers so the
    // rejection is handled the instant it occurs, not after.
    const assertion =
      expect(requestPromise).rejects.toThrow(/non-JSON response/);
    await vi.runAllTimersAsync();

    await assertion;
    expect(graphqlCallCount).toBe(5);
  });

  it("does not retry when Shopify returns a valid JSON error response", async () => {
    let graphqlCallCount = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        return jsonResponse({ access_token: "test-token" });
      }
      if (urlStr.includes("/admin/api/")) {
        graphqlCallCount++;
        return jsonResponse({ errors: [{ message: "field not found" }] });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = await createShopifyClient(env);
    await expect(client.request("query { bogus }")).rejects.toThrow(
      "field not found",
    );
    expect(graphqlCallCount).toBe(1);
  });
});

// --- Phase 2: relay mode (SHOPIFY_RELAY_URL / SHOPIFY_RELAY_SECRET) ---
//
// These env objects are deliberately NOT annotated with `: ShopifyEnv` —
// today's ShopifyEnv interface has no relay fields, so an explicit
// annotation on an object *literal* would trip TypeScript's excess-property
// check before the test ever ran. Spreading `env` (which is typed) into an
// un-annotated literal lets TypeScript infer a wider structural type; that
// inferred type is still assignable to the `ShopifyEnv`-typed parameter of
// createShopifyClient (structural, non-literal argument, so no excess-
// property check applies), so this compiles against the current
// implementation without editing shopify.ts.
const relaySecret = "relay-secret-value";
const relayEnv = {
  ...env,
  SHOPIFY_RELAY_URL: "https://relay.example.com",
  SHOPIFY_RELAY_SECRET: relaySecret,
};

/**
 * Every relay-mode fetch mock below throws on any URL other than the relay's
 * own `/graphql` endpoint. This is intentional, not incidental: today's
 * createShopifyClient always calls Shopify's OAuth endpoint directly
 * regardless of relay env vars, so with this strict mock every case in this
 * block is expected to fail at (or before) `createShopifyClient(relayEnv)`
 * with "Unexpected fetch to .../admin/oauth/access_token" — proof that no
 * relay routing exists yet. Once Phase 2 is implemented, these mocks also
 * become the correct GREEN-phase shape: no OAuth call, only relay calls.
 */
describe("createShopifyClient — relay mode", () => {
  it("sends GraphQL requests to the relay with X-Relay-Secret and never calls Shopify's OAuth endpoint directly", async () => {
    let relayCallCount = 0;
    let capturedHeaders: Headers | undefined;
    let capturedBody: string | undefined;
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr === "https://relay.example.com/graphql") {
        relayCallCount++;
        capturedHeaders = new Headers(init?.headers);
        capturedBody = init?.body as string;
        return jsonResponse({ data: { ok: true } });
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = await createShopifyClient(relayEnv);
    await expect(client.request("query { ok }")).resolves.toEqual({
      ok: true,
    });

    expect(relayCallCount).toBe(1);
    expect(capturedHeaders?.get("X-Relay-Secret")).toBe(relaySecret);
    expect(capturedBody).toBe(
      JSON.stringify({ query: "query { ok }", variables: undefined }),
    );
  });

  it("retries a non-JSON relay response using the existing 5-attempt backoff and raises NonJsonShopifyResponseError", async () => {
    let relayCallCount = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr === "https://relay.example.com/graphql") {
        relayCallCount++;
        return htmlChallengeResponse();
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    vi.useFakeTimers();
    const resultPromise = (async () => {
      const client = await createShopifyClient(relayEnv);
      return client.request("query { ok }");
    })();
    const assertion = expect(resultPromise).rejects.toThrow(
      NonJsonShopifyResponseError,
    );
    await vi.runAllTimersAsync();

    await assertion;
    expect(relayCallCount).toBe(5);
  });

  it("surfaces GraphQL top-level errors identically to direct mode, without retrying", async () => {
    let relayCallCount = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr === "https://relay.example.com/graphql") {
        relayCallCount++;
        return jsonResponse({ errors: [{ message: "field not found" }] });
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = await createShopifyClient(relayEnv);
    await expect(client.request("query { bogus }")).rejects.toThrow(
      "field not found",
    );
    expect(relayCallCount).toBe(1);
  });

  it("passes through mutation userErrors within data unchanged, matching direct mode", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr === "https://relay.example.com/graphql") {
        return jsonResponse({
          data: {
            customerUpdate: {
              userErrors: [{ field: ["email"], message: "is invalid" }],
            },
          },
        });
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = await createShopifyClient(relayEnv);
    const result = await client.request<{
      customerUpdate: {
        userErrors: { field: string[] | null; message: string }[];
      };
    }>("mutation { customerUpdate { userErrors { field message } } }");

    expect(result.customerUpdate.userErrors).toEqual([
      { field: ["email"], message: "is invalid" },
    ]);
  });
});

describe("createShopifyClient — relay misconfiguration", () => {
  it("throws a ShopifyApiError when SHOPIFY_RELAY_URL is set but SHOPIFY_RELAY_SECRET is missing, rather than silently falling back to direct calls", async () => {
    const halfConfiguredEnv = {
      ...env,
      SHOPIFY_RELAY_URL: "https://relay.example.com",
    };
    const fetchMock = vi.fn(async (url: string | URL) => {
      throw new Error(`Unexpected fetch to ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(createShopifyClient(halfConfiguredEnv)).rejects.toThrow(
      ShopifyApiError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
