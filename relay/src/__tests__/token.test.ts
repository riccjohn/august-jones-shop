// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createTokenManager,
  NonJsonUpstreamResponseError,
  type TokenEnv,
} from "../token";

const env: TokenEnv = {
  SHOPIFY_STORE_DOMAIN: "test-shop.myshopify.com",
  SHOPIFY_CLIENT_ID: "client-id",
  SHOPIFY_CLIENT_SECRET: "client-secret",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("createTokenManager — minting and caching", () => {
  it("mints a token once and reuses it across subsequent getToken calls", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ access_token: "tok-1", expires_in: 3600 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);
    const first = await manager.getToken();
    const second = await manager.getToken();

    expect(first).toBe("tok-1");
    expect(second).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("exchanges the client_credentials grant against the store's own OAuth endpoint", async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) =>
      jsonResponse({ access_token: "tok-1", expires_in: 3600 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createTokenManager(env).getToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://test-shop.myshopify.com/admin/oauth/access_token",
    );
    expect(init.method).toBe("POST");
    const body = new URLSearchParams(init.body as string);
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("client_secret")).toBe("client-secret");
  });

  it("proactively refreshes the cached token before expires_in elapses, not only reactively", async () => {
    vi.useFakeTimers();
    let mintCount = 0;
    const fetchMock = vi.fn(async () => {
      mintCount++;
      return jsonResponse({
        access_token: `tok-${mintCount}`,
        expires_in: 3600,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);
    expect(await manager.getToken()).toBe("tok-1");

    // 59 of the token's 60 minutes have elapsed — more than a minute of
    // validity remains, so the cached token is still reused.
    await vi.advanceTimersByTimeAsync(59 * 60 * 1000);
    expect(await manager.getToken()).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Cross into the last minute of the token's lifetime (61 of 60 minutes
    // elapsed against the mint time) — the manager must have refreshed
    // proactively before expires_in actually elapsed, not after.
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(await manager.getToken()).toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("invalidate() forces a re-mint on the next getToken call", async () => {
    let mintCount = 0;
    const fetchMock = vi.fn(async () => {
      mintCount++;
      return jsonResponse({
        access_token: `tok-${mintCount}`,
        expires_in: 3600,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);
    expect(await manager.getToken()).toBe("tok-1");

    manager.invalidate();

    expect(await manager.getToken()).toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not let an in-flight mint repopulate the cache after invalidate() runs during it", async () => {
    let resolveFirstMint: (response: Response) => void = () => {};
    const firstMintPromise = new Promise<Response>((resolve) => {
      resolveFirstMint = resolve;
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => firstMintPromise)
      .mockImplementationOnce(async () =>
        jsonResponse({ access_token: "tok-2", expires_in: 3600 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);
    const inFlight = manager.getToken();

    // invalidate() fires while the mint above is still awaiting its fetch —
    // this is the race the generation counter guards against.
    manager.invalidate();
    resolveFirstMint(jsonResponse({ access_token: "tok-1", expires_in: 3600 }));

    // The caller that started the in-flight mint still gets its token...
    await expect(inFlight).resolves.toBe("tok-1");

    // ...but the cache must stay empty: the next call re-mints from scratch
    // rather than returning "tok-1", which invalidate() was meant to evict.
    const afterInvalidate = await manager.getToken();
    expect(afterInvalidate).toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not hand a caller arriving after invalidate() the token from a mint already in flight", async () => {
    // This is the shape of forwardGraphqlRequest's 401 path: Shopify rejects
    // a token, the relay invalidates and immediately asks for another. If
    // that second getToken() joins a mint that started before the 401, it
    // gets back the very token Shopify just rejected and the retry fails for
    // exactly the same reason.
    let resolveFirstMint: (response: Response) => void = () => {};
    const firstMintPromise = new Promise<Response>((resolve) => {
      resolveFirstMint = resolve;
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => firstMintPromise)
      .mockImplementationOnce(async () =>
        jsonResponse({ access_token: "tok-2", expires_in: 3600 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);
    const inFlight = manager.getToken();

    manager.invalidate();
    // Asked for while the first mint is still unresolved, unlike the test
    // above which waits for it to settle first.
    const afterInvalidate = manager.getToken();

    resolveFirstMint(jsonResponse({ access_token: "tok-1", expires_in: 3600 }));

    await expect(inFlight).resolves.toBe("tok-1");
    await expect(afterInvalidate).resolves.toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("still shares one mint between concurrent callers within a generation", async () => {
    let mintCount = 0;
    const fetchMock = vi.fn(async () => {
      mintCount++;
      return jsonResponse({
        access_token: `tok-${mintCount}`,
        expires_in: 3600,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);
    const tokens = await Promise.all([
      manager.getToken(),
      manager.getToken(),
      manager.getToken(),
    ]);

    expect(tokens).toEqual(["tok-1", "tok-1", "tok-1"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("createTokenManager — non-JSON upstream responses", () => {
  it("surfaces a non-JSON token-exchange response verbatim via NonJsonUpstreamResponseError", async () => {
    const html = "<!DOCTYPE html><html><body>bot check</body></html>";
    const fetchMock = vi.fn(
      async () =>
        new Response(html, {
          status: 403,
          headers: { "Content-Type": "text/html" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);

    let caught: unknown;
    try {
      await manager.getToken();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(NonJsonUpstreamResponseError);
    const err = caught as NonJsonUpstreamResponseError;
    expect(err.status).toBe(403);
    expect(err.body).toBe(html);
  });

  it("does not cache a token after a failed (non-JSON) mint attempt", async () => {
    const html = "<!DOCTYPE html><html><body>bot check</body></html>";
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls++;
      if (calls === 1) {
        return new Response(html, {
          status: 403,
          headers: { "Content-Type": "text/html" },
        });
      }
      return jsonResponse({ access_token: "tok-1", expires_in: 3600 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const manager = createTokenManager(env);

    await expect(manager.getToken()).rejects.toBeInstanceOf(
      NonJsonUpstreamResponseError,
    );

    const token = await manager.getToken();
    expect(token).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
