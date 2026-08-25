import { afterEach, describe, expect, it, vi } from "vitest";
import { createShopifyClient, type ShopifyEnv } from "../shopify";

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
