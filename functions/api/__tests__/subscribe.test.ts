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

/**
 * Dispatches by mutation name embedded in the query string, since the
 * existing-customer path now issues two sequential `client.request` calls
 * (customerUpdate, then customerEmailMarketingConsentUpdate) instead of one.
 */
function makeRequestMock(responses: {
  customerCreate?: unknown;
  customerUpdate?: unknown;
  customerEmailMarketingConsentUpdate?: unknown;
}) {
  const mock = vi.fn(
    async (query: string, _variables?: Record<string, unknown>) => {
      if (query.includes("customerEmailMarketingConsentUpdate")) {
        return {
          customerEmailMarketingConsentUpdate:
            responses.customerEmailMarketingConsentUpdate,
        };
      }
      if (query.includes("customerUpdate")) {
        return { customerUpdate: responses.customerUpdate };
      }
      if (query.includes("customerCreate")) {
        return { customerCreate: responses.customerCreate };
      }
      throw new Error(`Unexpected query: ${query}`);
    },
  );
  // vi.fn's Mock<T> type collapses a generic implementation's return type to
  // `unknown`, so it can never structurally satisfy ShopifyClient["request"]'s
  // `<T>(...) => Promise<T>` signature — this mock's return is deliberately
  // narrower (a concrete union of the three mutation shapes), asserted here
  // rather than reshaped to fit a generic it doesn't need.
  return mock as unknown as ShopifyClient["request"];
}

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
      request: makeRequestMock({
        customerUpdate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
        customerEmailMarketingConsentUpdate: {
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

describe("subscribe onRequestPost — existing customer: emailMarketingConsent via dedicated mutation", () => {
  it("does not send emailMarketingConsent through customerUpdate, and sets consent via customerEmailMarketingConsentUpdate", async () => {
    const requestMock = makeRequestMock({
      customerUpdate: {
        customer: { id: "gid://shopify/Customer/1" },
        userErrors: [],
      },
      customerEmailMarketingConsentUpdate: {
        customer: { id: "gid://shopify/Customer/1" },
        userErrors: [],
      },
    });
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue({
        id: "gid://shopify/Customer/1",
        note: null,
        tags: [],
      }),
      request: requestMock,
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(requestMock).toHaveBeenCalledTimes(2);

    // requestMock is cast to ShopifyClient["request"]'s generic signature for
    // assignment above, which erases the concrete Mock type — recover it here
    // (via unknown, not `any`) purely to inspect recorded call arguments.
    const calls = (
      requestMock as unknown as {
        mock: { calls: [string, Record<string, unknown> | undefined][] };
      }
    ).mock.calls;

    const [updateQuery, updateVariables] = calls[0];
    expect(updateQuery).toContain("customerUpdate");
    expect(updateVariables).toMatchObject({
      input: { id: "gid://shopify/Customer/1", email: validBody.email },
    });
    expect(updateVariables?.input).not.toHaveProperty("emailMarketingConsent");

    const [consentQuery, consentVariables] = calls[1];
    expect(consentQuery).toContain("customerEmailMarketingConsentUpdate");
    expect(consentVariables).toMatchObject({
      input: {
        customerId: "gid://shopify/Customer/1",
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
      },
    });
  });

  it("returns an error when customerEmailMarketingConsentUpdate reports a userError, even though customerUpdate succeeded", async () => {
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue({
        id: "gid://shopify/Customer/1",
        note: null,
        tags: [],
      }),
      request: makeRequestMock({
        customerUpdate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
        customerEmailMarketingConsentUpdate: {
          customer: null,
          userErrors: [{ field: null, message: "Consent update failed" }],
        },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Consent update failed" });
  });
});

describe("subscribe onRequestPost — customerCreate 'already taken' race recovery", () => {
  it("falls back to the update flow when customerCreate reports the email is already taken but a second lookup finds the customer", async () => {
    const findCustomerByEmail = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "gid://shopify/Customer/1",
        note: null,
        tags: [],
      });
    const client = makeClient({
      findCustomerByEmail,
      request: makeRequestMock({
        customerCreate: {
          customer: null,
          userErrors: [
            { field: ["email"], message: "Email has already been taken" },
          ],
        },
        customerUpdate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
        customerEmailMarketingConsentUpdate: {
          customer: { id: "gid://shopify/Customer/1" },
          userErrors: [],
        },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(findCustomerByEmail).toHaveBeenCalledTimes(2);
  });

  it("surfaces the original 'already taken' error when the second lookup still finds nothing", async () => {
    const findCustomerByEmail = vi.fn().mockResolvedValue(null);
    const client = makeClient({
      findCustomerByEmail,
      request: makeRequestMock({
        customerCreate: {
          customer: null,
          userErrors: [
            { field: ["email"], message: "Email has already been taken" },
          ],
        },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Email has already been taken",
    });
    expect(findCustomerByEmail).toHaveBeenCalledTimes(2);
  });

  it("does not attempt recovery for unrelated customerCreate userErrors", async () => {
    const findCustomerByEmail = vi.fn().mockResolvedValue(null);
    const client = makeClient({
      findCustomerByEmail,
      request: makeRequestMock({
        customerCreate: {
          customer: null,
          userErrors: [{ field: ["email"], message: "Email is invalid" }],
        },
      }),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Email is invalid" });
    expect(findCustomerByEmail).toHaveBeenCalledTimes(1);
  });
});
