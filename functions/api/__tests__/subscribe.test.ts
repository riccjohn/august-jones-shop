import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShopifyClient, ShopifyEnv } from "../_lib/shopify";
import * as shopifyLib from "../_lib/shopify";
import { onRequestPost } from "../subscribe";

vi.mock("@sentry/cloudflare", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("../_lib/shopify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../_lib/shopify")>();
  return { ...actual, createShopifyClient: vi.fn() };
});

const env: ShopifyEnv = {
  SHOPIFY_STORE_DOMAIN: "test-shop.myshopify.com",
  SHOPIFY_CLIENT_ID: "client-id",
  SHOPIFY_CLIENT_SECRET: "client-secret",
};

function makeClient(overrides: Partial<ShopifyClient> = {}): ShopifyClient {
  return {
    request: vi.fn(),
    findCustomerByEmail: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeContext(body: unknown): Parameters<typeof onRequestPost>[0] {
  return {
    request: new Request("https://example.com/api/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    env,
  } as Parameters<typeof onRequestPost>[0];
}

const validBody = { email: "jane@example.com", source: "footer" };

beforeEach(() => {
  vi.mocked(shopifyLib.createShopifyClient).mockReset();
});

describe("subscribe onRequestPost — null-customer guard", () => {
  it("returns an error, not 200, when creating a new customer returns no userErrors and no customer", async () => {
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue(null),
      request: vi.fn().mockResolvedValue({
        customerCreate: { customer: null, userErrors: [] },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Shopify did not return a customer",
    });
  });

  it("returns an error, not 200, when updating an existing customer returns no userErrors and no customer", async () => {
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue({
        id: "gid://shopify/Customer/1",
        note: null,
        tags: [],
      }),
      request: vi.fn().mockResolvedValue({
        customerUpdate: { customer: null, userErrors: [] },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Shopify did not return a customer",
    });
  });

  it("returns 200 when creating a new customer succeeds with a customer", async () => {
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue(null),
      request: vi.fn().mockResolvedValue({
        customerCreate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns 200 when updating an existing customer succeeds with a customer", async () => {
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue({
        id: "gid://shopify/Customer/1",
        note: null,
        tags: [],
      }),
      request: vi.fn().mockResolvedValue({
        customerUpdate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
