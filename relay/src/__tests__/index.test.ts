// @vitest-environment node
import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, type RelayEnv } from "../index";

const RELAY_SECRET = "relay-secret-value";

const baseEnv: RelayEnv = {
  SHOPIFY_STORE_DOMAIN: "test-shop.myshopify.com",
  SHOPIFY_CLIENT_ID: "client-id",
  SHOPIFY_CLIENT_SECRET: "client-secret",
  SHOPIFY_RELAY_SECRET: RELAY_SECRET,
};

interface RawResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

function rawRequest(
  port: number,
  options: { method: string; path: string; headers?: Record<string, string> },
  body?: string,
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method: options.method,
        path: options.path,
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

async function withServer(
  env: RelayEnv,
  fn: (port: number) => Promise<void>,
): Promise<void> {
  const server = createServer(env);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = (server.address() as AddressInfo).port;
    await fn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function graphqlHeaders(body: string, extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "Content-Length": String(Buffer.byteLength(body)),
    ...extra,
  };
}

function makeFetchMock() {
  let tokenCalls = 0;
  let graphqlCalls = 0;
  const fetchMock = vi.fn(async (url: string | URL, _init: RequestInit) => {
    const urlStr = url.toString();
    if (urlStr === "https://test-shop.myshopify.com/admin/oauth/access_token") {
      tokenCalls++;
      return new Response(
        JSON.stringify({ access_token: `tok-${tokenCalls}`, expires_in: 3600 }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (
      urlStr ===
      "https://test-shop.myshopify.com/admin/api/2026-07/graphql.json"
    ) {
      graphqlCalls++;
      return new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected fetch to ${urlStr}`);
  });
  return {
    fetchMock,
    tokenCallCount: () => tokenCalls,
    graphqlCallCount: () => graphqlCalls,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /healthz", () => {
  it("returns 200 without a secret", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("healthz must not call upstream");
      }),
    );

    await withServer(baseEnv, async (port) => {
      const res = await rawRequest(port, { method: "GET", path: "/healthz" });
      expect(res.status).toBe(200);
    });
  });

  it("returns 200 even when SHOPIFY_RELAY_SECRET is unset", async () => {
    const { SHOPIFY_RELAY_SECRET: _omit, ...envWithoutSecret } = baseEnv;

    await withServer(envWithoutSecret as RelayEnv, async (port) => {
      const res = await rawRequest(port, { method: "GET", path: "/healthz" });
      expect(res.status).toBe(200);
    });
  });
});

describe("POST /graphql — forwarding", () => {
  it("forwards {query, variables} with a self-minted access token to the store's Admin API", async () => {
    const { fetchMock } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await withServer(baseEnv, async (port) => {
      const body = JSON.stringify({
        query: "query { shop { name } }",
        variables: { first: 1 },
      });
      const res = await rawRequest(
        port,
        {
          method: "POST",
          path: "/graphql",
          headers: graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET }),
        },
        body,
      );

      expect(res.status).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ data: { ok: true } });
    });

    const graphqlCall = fetchMock.mock.calls.find(([url]) =>
      url.toString().includes("/admin/api/"),
    );
    expect(graphqlCall).toBeDefined();
    const [url, init] = graphqlCall as [string, RequestInit];
    expect(url).toBe(
      "https://test-shop.myshopify.com/admin/api/2026-07/graphql.json",
    );
    expect(init.method).toBe("POST");
    expect(
      (init.headers as Record<string, string>)["X-Shopify-Access-Token"],
    ).toBe("tok-1");
    expect(JSON.parse(init.body as string)).toEqual({
      query: "query { shop { name } }",
      variables: { first: 1 },
    });
  });

  it("reuses a cached token across subsequent requests, minting it only once", async () => {
    const { fetchMock, tokenCallCount, graphqlCallCount } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    await withServer(baseEnv, async (port) => {
      const body = JSON.stringify({ query: "query { shop { name } }" });
      const headers = graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET });

      const first = await rawRequest(
        port,
        { method: "POST", path: "/graphql", headers },
        body,
      );
      const second = await rawRequest(
        port,
        { method: "POST", path: "/graphql", headers },
        body,
      );

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
    });

    expect(tokenCallCount()).toBe(1);
    expect(graphqlCallCount()).toBe(2);
  });
});

describe("POST /graphql — secret gating", () => {
  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["wrong", "not-the-secret"],
  ])(
    "rejects a %s X-Relay-Secret with 401 and no upstream call",
    async (_label, secret) => {
      const fetchMock = vi.fn(async () => {
        throw new Error("must not call upstream when secret is invalid");
      });
      vi.stubGlobal("fetch", fetchMock);

      await withServer(baseEnv, async (port) => {
        const body = JSON.stringify({ query: "query { shop { name } }" });
        const headers = graphqlHeaders(
          body,
          secret === undefined ? {} : { "X-Relay-Secret": secret },
        );

        const res = await rawRequest(
          port,
          { method: "POST", path: "/graphql", headers },
          body,
        );
        expect(res.status).toBe(401);
      });

      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("fails closed when SHOPIFY_RELAY_SECRET is unset: every /graphql request is rejected, never allowed through", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error(
        "must not call upstream when relay secret is unconfigured",
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { SHOPIFY_RELAY_SECRET: _omit, ...envWithoutSecret } = baseEnv;

    await withServer(envWithoutSecret as RelayEnv, async (port) => {
      const body = JSON.stringify({ query: "query { shop { name } }" });
      const headerVariants: Record<string, string>[] = [
        graphqlHeaders(body),
        graphqlHeaders(body, { "X-Relay-Secret": "" }),
        graphqlHeaders(body, { "X-Relay-Secret": "anything" }),
      ];

      for (const headers of headerVariants) {
        const res = await rawRequest(
          port,
          { method: "POST", path: "/graphql", headers },
          body,
        );
        expect(res.status).toBe(401);
      }
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("routing", () => {
  it.each([
    ["GET", "/graphql"],
    ["PUT", "/graphql"],
    ["DELETE", "/graphql"],
    ["POST", "/healthz"],
    ["GET", "/"],
    ["GET", "/does-not-exist"],
  ])("returns 404 for %s %s", async (method, path) => {
    await withServer(baseEnv, async (port) => {
      const res = await rawRequest(port, {
        method,
        path,
        headers: { "X-Relay-Secret": RELAY_SECRET },
      });
      expect(res.status).toBe(404);
    });
  });
});

describe("POST /graphql — upstream 401 retry", () => {
  it("invalidates the cached token, re-mints, and retries once after an upstream 401", async () => {
    let tokenCalls = 0;
    let graphqlCalls = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        tokenCalls++;
        return new Response(
          JSON.stringify({
            access_token: `tok-${tokenCalls}`,
            expires_in: 3600,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/admin/api/")) {
        graphqlCalls++;
        if (graphqlCalls === 1) {
          return new Response(
            JSON.stringify({
              errors: [{ message: "Invalid API key or access token" }],
            }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await withServer(baseEnv, async (port) => {
      const body = JSON.stringify({ query: "query { shop { name } }" });
      const res = await rawRequest(
        port,
        {
          method: "POST",
          path: "/graphql",
          headers: graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET }),
        },
        body,
      );
      expect(res.status).toBe(200);
      expect(JSON.parse(res.body)).toEqual({ data: { ok: true } });
    });

    expect(tokenCalls).toBe(2);
    expect(graphqlCalls).toBe(2);
  });

  it("surfaces a second consecutive 401 to the caller", async () => {
    let graphqlCalls = 0;
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        return new Response(
          JSON.stringify({ access_token: "tok", expires_in: 3600 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/admin/api/")) {
        graphqlCalls++;
        return new Response(
          JSON.stringify({
            errors: [{ message: "Invalid API key or access token" }],
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await withServer(baseEnv, async (port) => {
      const body = JSON.stringify({ query: "query { shop { name } }" });
      const res = await rawRequest(
        port,
        {
          method: "POST",
          path: "/graphql",
          headers: graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET }),
        },
        body,
      );
      expect(res.status).toBe(401);
    });

    expect(graphqlCalls).toBe(2);
  });
});

describe("POST /graphql — non-JSON upstream responses forwarded verbatim", () => {
  const html = "<!DOCTYPE html><html><body>bot check</body></html>";

  it("mirrors a non-JSON token-exchange response's status and body", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        return new Response(html, {
          status: 403,
          headers: { "Content-Type": "text/html" },
        });
      }
      throw new Error(
        `Unexpected fetch to ${urlStr} — graphql must not be called`,
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await withServer(baseEnv, async (port) => {
      const body = JSON.stringify({ query: "query { shop { name } }" });
      const res = await rawRequest(
        port,
        {
          method: "POST",
          path: "/graphql",
          headers: graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET }),
        },
        body,
      );
      expect(res.status).toBe(403);
      expect(res.body).toBe(html);
    });
  });

  it("mirrors a non-JSON GraphQL response's status and body", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/admin/oauth/access_token")) {
        return new Response(
          JSON.stringify({ access_token: "tok", expires_in: 3600 }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.includes("/admin/api/")) {
        return new Response(html, {
          status: 403,
          headers: { "Content-Type": "text/html" },
        });
      }
      throw new Error(`Unexpected fetch to ${urlStr}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await withServer(baseEnv, async (port) => {
      const body = JSON.stringify({ query: "query { shop { name } }" });
      const res = await rawRequest(
        port,
        {
          method: "POST",
          path: "/graphql",
          headers: graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET }),
        },
        body,
      );
      expect(res.status).toBe(403);
      expect(res.body).toBe(html);
    });
  });
});

describe("logging", () => {
  it("never logs the relay secret, the client secret, or request bodies/headers", async () => {
    const { fetchMock } = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      const secretMarker = "distinctive-query-marker-should-not-leak";
      await withServer(baseEnv, async (port) => {
        const body = JSON.stringify({
          query: `query { shop { name } } # ${secretMarker}`,
        });
        await rawRequest(
          port,
          {
            method: "POST",
            path: "/graphql",
            headers: graphqlHeaders(body, { "X-Relay-Secret": RELAY_SECRET }),
          },
          body,
        );
      });

      const allLoggedText = [
        ...logSpy.mock.calls,
        ...errorSpy.mock.calls,
        ...warnSpy.mock.calls,
      ]
        .flat()
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join("\n");

      expect(allLoggedText).not.toContain(RELAY_SECRET);
      expect(allLoggedText).not.toContain(baseEnv.SHOPIFY_CLIENT_SECRET);
      expect(allLoggedText).not.toContain(secretMarker);
      expect(allLoggedText).not.toContain("tok-1");
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
