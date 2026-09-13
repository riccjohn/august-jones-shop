import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
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

const CUSTOMER_ID = "gid://shopify/Customer/1";

const existingCustomer = { id: CUSTOMER_ID, note: null, tags: [] };

const okCustomer = { customer: { id: CUSTOMER_ID }, userErrors: [] };

/**
 * vi.fn's Mock<T> collapses a generic implementation's return type to
 * `unknown`, so no mock can structurally satisfy ShopifyClient["request"]'s
 * `<T>(...) => Promise<T>` signature. This is the single cast site — tests
 * hold the concrete mock and assert on its `.mock.calls` directly.
 */
function asRequest(mock: Mock): ShopifyClient["request"] {
  return mock as unknown as ShopifyClient["request"];
}

function makeClient(overrides: Partial<ShopifyClient> = {}): ShopifyClient {
  return {
    request: vi.fn(),
    findCustomerByEmail: vi.fn().mockResolvedValue(null),
    findCustomerByEmailDirect: vi.fn().mockResolvedValue(null),
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
 * existing-customer path issues two sequential `client.request` calls
 * (customerEmailMarketingConsentUpdate, then customerUpdate) instead of one.
 */
function makeRequestMock(responses: {
  customerCreate?: unknown;
  customerUpdate?: unknown;
  customerEmailMarketingConsentUpdate?: unknown;
}) {
  return vi.fn(async (query: string, _variables?: Record<string, unknown>) => {
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
  });
}

/** Both mutations on the existing-customer path succeeding. */
function successfulUpdateMock() {
  return makeRequestMock({
    customerUpdate: okCustomer,
    customerEmailMarketingConsentUpdate: okCustomer,
  });
}

beforeEach(() => {
  vi.mocked(shopifyLib.createShopifyClient).mockReset();
});

describe("subscribe onRequestPost — null-customer guard", () => {
  it("returns an error, not 200, when creating a new customer returns no userErrors and no customer", async () => {
    const client = makeClient({
      request: asRequest(
        makeRequestMock({
          customerCreate: { customer: null, userErrors: [] },
        }),
      ),
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
      findCustomerByEmail: vi.fn().mockResolvedValue(existingCustomer),
      request: asRequest(
        makeRequestMock({
          customerEmailMarketingConsentUpdate: okCustomer,
          customerUpdate: { customer: null, userErrors: [] },
        }),
      ),
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
      request: asRequest(makeRequestMock({ customerCreate: okCustomer })),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns 200 when updating an existing customer succeeds with a customer", async () => {
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue(existingCustomer),
      request: asRequest(successfulUpdateMock()),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("subscribe onRequestPost — new customer: emailMarketingConsent on customerCreate", () => {
  it("still sends emailMarketingConsent through customerCreate, which accepts it", async () => {
    // Load-bearing: only customerUpdate rejects emailMarketingConsent. If a
    // future refactor strips it from the create input to match, new signups
    // would silently never be subscribed.
    const requestMock = makeRequestMock({ customerCreate: okCustomer });
    const client = makeClient({ request: asRequest(requestMock) });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    const [createQuery, createVariables] = requestMock.mock.calls[0];
    expect(createQuery).toContain("customerCreate");
    expect(createVariables).toMatchObject({
      input: {
        email: validBody.email,
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
      },
    });
  });
});

describe("subscribe onRequestPost — existing customer: emailMarketingConsent via dedicated mutation", () => {
  it("sets consent via customerEmailMarketingConsentUpdate first, then updates the profile without emailMarketingConsent", async () => {
    const requestMock = successfulUpdateMock();
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue(existingCustomer),
      request: asRequest(requestMock),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(requestMock).toHaveBeenCalledTimes(2);

    const [consentQuery, consentVariables] = requestMock.mock.calls[0];
    expect(consentQuery).toContain("customerEmailMarketingConsentUpdate");
    expect(consentVariables).toMatchObject({
      input: {
        customerId: CUSTOMER_ID,
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
      },
    });

    const [updateQuery, updateVariables] = requestMock.mock.calls[1];
    expect(updateQuery).toContain("customerUpdate");
    expect(updateVariables).toMatchObject({
      input: { id: CUSTOMER_ID, email: validBody.email },
    });
    expect(updateVariables?.input).not.toHaveProperty("emailMarketingConsent");
  });

  it("returns an error and skips the profile update when consent fails", async () => {
    // Consent leads so that a failure here costs nothing: no note is appended,
    // so the visitor's retry can't stack a duplicate one.
    const requestMock = makeRequestMock({
      customerEmailMarketingConsentUpdate: {
        customer: null,
        userErrors: [{ field: null, message: "Consent update failed" }],
      },
      customerUpdate: okCustomer,
    });
    const client = makeClient({
      findCustomerByEmail: vi.fn().mockResolvedValue(existingCustomer),
      request: asRequest(requestMock),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Consent update failed" });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});

describe("subscribe onRequestPost — customerCreate 'already taken' race recovery", () => {
  const alreadyTaken = {
    customer: null,
    userErrors: [{ field: ["email"], message: "Email has already been taken" }],
  };

  it("recovers through the direct lookup, not another search, and falls back to the update flow", async () => {
    // The search index is what missed the customer in the first place;
    // re-running it milliseconds later would usually miss again.
    const findCustomerByEmail = vi.fn().mockResolvedValue(null);
    const findCustomerByEmailDirect = vi
      .fn()
      .mockResolvedValue(existingCustomer);
    const client = makeClient({
      findCustomerByEmail,
      findCustomerByEmailDirect,
      request: asRequest(
        makeRequestMock({
          customerCreate: alreadyTaken,
          customerUpdate: okCustomer,
          customerEmailMarketingConsentUpdate: okCustomer,
        }),
      ),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(findCustomerByEmail).toHaveBeenCalledTimes(1);
    expect(findCustomerByEmailDirect).toHaveBeenCalledWith(validBody.email);
  });

  it("surfaces the original 'already taken' error when the direct lookup still finds nothing", async () => {
    const findCustomerByEmailDirect = vi.fn().mockResolvedValue(null);
    const client = makeClient({
      findCustomerByEmailDirect,
      request: asRequest(makeRequestMock({ customerCreate: alreadyTaken })),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Email has already been taken",
    });
    expect(findCustomerByEmailDirect).toHaveBeenCalledTimes(1);
  });

  it("does not attempt recovery for unrelated customerCreate userErrors", async () => {
    const findCustomerByEmailDirect = vi.fn().mockResolvedValue(null);
    const client = makeClient({
      findCustomerByEmailDirect,
      request: asRequest(
        makeRequestMock({
          customerCreate: {
            customer: null,
            userErrors: [{ field: ["email"], message: "Email is invalid" }],
          },
        }),
      ),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Email is invalid" });
    expect(findCustomerByEmailDirect).not.toHaveBeenCalled();
  });
});
