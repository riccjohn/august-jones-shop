// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardGraphqlRequest, type GraphqlEnv } from "../graphql";

const env: GraphqlEnv = {
  SHOPIFY_STORE_DOMAIN: "test-shop.myshopify.com",
};

interface FakeTokenManager {
  getToken: () => Promise<string>;
  invalidate: () => void;
}

function fakeTokenManager(
  tokens: string[] = ["tok-1", "tok-2", "tok-3"],
): FakeTokenManager & { invalidateCallCount: () => number } {
  let index = 0;
  let invalidateCalls = 0;
  return {
    getToken: vi.fn(async () => tokens[Math.min(index++, tokens.length - 1)]),
    invalidate: vi.fn(() => {
      invalidateCalls++;
      index = Math.min(index, tokens.length - 1);
    }),
    invalidateCallCount: () => invalidateCalls,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("forwardGraphqlRequest — forwarding", () => {
  it("forwards {query, variables} to the store's Admin API with the token from the token manager", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse({ data: { ok: true } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const tokenManager = fakeTokenManager(["tok-abc"]);
    const result = await forwardGraphqlRequest(env, tokenManager, {
      query: "query { shop { name } }",
      variables: { first: 1 },
    });

    expect(result.status).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ data: { ok: true } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://test-shop.myshopify.com/admin/api/2026-07/graphql.json",
    );
    expect(init.method).toBe("POST");
    expect(
      (init.headers as Record<string, string>)["X-Shopify-Access-Token"],
    ).toBe("tok-abc");
    expect(JSON.parse(init.body as string)).toEqual({
      query: "query { shop { name } }",
      variables: { first: 1 },
    });
  });

  it("returns the upstream status, body, and content type verbatim on a normal response", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ errors: [{ message: "boom" }] }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const tokenManager = fakeTokenManager();
    const result = await forwardGraphqlRequest(env, tokenManager, {
      query: "query { shop { name } }",
    });

    expect(result.status).toBe(422);
    expect(JSON.parse(result.body)).toEqual({ errors: [{ message: "boom" }] });
    expect(result.contentType).toBe("application/json");
  });

  it("returns a non-JSON upstream response verbatim, with its original status", async () => {
    const html = "<!DOCTYPE html><html><body>bot check</body></html>";
    const fetchMock = vi.fn(
      async () =>
        new Response(html, {
          status: 403,
          headers: { "Content-Type": "text/html" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const tokenManager = fakeTokenManager();
    const result = await forwardGraphqlRequest(env, tokenManager, {
      query: "query { shop { name } }",
    });

    expect(result.status).toBe(403);
    expect(result.body).toBe(html);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("propagates a token-manager failure without swallowing or rewrapping it", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("must not call the GraphQL endpoint");
    });
    vi.stubGlobal("fetch", fetchMock);

    const tokenFailure = new Error("token exchange failed");
    const tokenManager: FakeTokenManager = {
      getToken: vi.fn(async () => {
        throw tokenFailure;
      }),
      invalidate: vi.fn(),
    };

    await expect(
      forwardGraphqlRequest(env, tokenManager, {
        query: "query { shop { name } }",
      }),
    ).rejects.toBe(tokenFailure);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("forwardGraphqlRequest — upstream 401 handling", () => {
  it("invalidates the token, re-mints once, and retries after an upstream 401", async () => {
    let graphqlCalls = 0;
    const seenTokens: string[] = [];
    const fetchMock = vi.fn(async (_url: string | URL, init: RequestInit) => {
      graphqlCalls++;
      seenTokens.push(
        (init.headers as Record<string, string>)["X-Shopify-Access-Token"],
      );
      if (graphqlCalls === 1) {
        return jsonResponse(
          { errors: [{ message: "Invalid API key or access token" }] },
          401,
        );
      }
      return jsonResponse({ data: { ok: true } });
    });
    vi.stubGlobal("fetch", fetchMock);

    const tokenManager = fakeTokenManager(["tok-1", "tok-2"]);
    const result = await forwardGraphqlRequest(env, tokenManager, {
      query: "query { shop { name } }",
    });

    expect(result.status).toBe(200);
    expect(graphqlCalls).toBe(2);
    expect(seenTokens).toEqual(["tok-1", "tok-2"]);
    expect(tokenManager.invalidateCallCount()).toBe(1);
  });

  it("surfaces a second consecutive 401 to the caller without retrying again", async () => {
    let graphqlCalls = 0;
    const fetchMock = vi.fn(async () => {
      graphqlCalls++;
      return jsonResponse(
        { errors: [{ message: "Invalid API key or access token" }] },
        401,
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const tokenManager = fakeTokenManager(["tok-1", "tok-2"]);
    const result = await forwardGraphqlRequest(env, tokenManager, {
      query: "query { shop { name } }",
    });

    expect(result.status).toBe(401);
    expect(graphqlCalls).toBe(2);
    expect(tokenManager.invalidateCallCount()).toBe(1);
  });
});
