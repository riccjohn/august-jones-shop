import * as Sentry from "@sentry/cloudflare";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { ShopifyClient, ShopifyEnv } from "../_lib/shopify";
import * as shopifyLib from "../_lib/shopify";
import { onRequestPost } from "../contact";

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

const existingCustomer = {
  id: CUSTOMER_ID,
  note: "Earlier submission",
  tags: ["contact-form"],
};

const validBody = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  instagram: "@jane",
  team: "Badgers",
  pieceType: "Hoodie",
  size: "M",
  materialsSource: "I'll send a jersey",
  message: "Excited!",
  policyAgreed: true,
};

/** See the matching note in subscribe.test.ts — single cast site. */
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
    request: new Request("https://example.com/api/contact", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    env,
  } as Parameters<typeof onRequestPost>[0];
}

function makeRequestMock(responses: {
  customerCreate?: unknown;
  customerUpdate?: unknown;
  draftOrderCreate?: unknown;
}) {
  return vi.fn(async (query: string, _variables?: Record<string, unknown>) => {
    if (query.includes("draftOrderCreate")) {
      return {
        draftOrderCreate: responses.draftOrderCreate ?? {
          draftOrder: { id: "gid://shopify/DraftOrder/1" },
          userErrors: [],
        },
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

const alreadyTaken = {
  customer: null,
  userErrors: [{ field: ["email"], message: "Email has already been taken" }],
};

beforeEach(() => {
  vi.mocked(shopifyLib.createShopifyClient).mockReset();
});

describe("contact onRequestPost — customerCreate 'already taken' race recovery", () => {
  it("recovers through the direct lookup and updates the customer instead of dropping the submission", async () => {
    const findCustomerByEmail = vi.fn().mockResolvedValue(null);
    const findCustomerByEmailDirect = vi
      .fn()
      .mockResolvedValue(existingCustomer);
    const requestMock = makeRequestMock({
      customerCreate: alreadyTaken,
      customerUpdate: { customer: { id: CUSTOMER_ID }, userErrors: [] },
    });
    const client = makeClient({
      findCustomerByEmail,
      findCustomerByEmailDirect,
      request: asRequest(requestMock),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(findCustomerByEmail).toHaveBeenCalledTimes(1);
    expect(findCustomerByEmailDirect).toHaveBeenCalledWith(validBody.email);

    // The recovered customer is updated — note appended, tag merged — and the
    // draft order is still attached to them.
    const [updateQuery, updateVariables] = requestMock.mock.calls[1];
    expect(updateQuery).toContain("customerUpdate");
    expect(updateVariables).toMatchObject({
      input: { id: CUSTOMER_ID, tags: ["contact-form"] },
    });

    const [draftQuery, draftVariables] = requestMock.mock.calls[2];
    expect(draftQuery).toContain("draftOrderCreate");
    expect(draftVariables).toMatchObject({
      input: { purchasingEntity: { customerId: CUSTOMER_ID } },
    });
  });

  it("surfaces the original error when the direct lookup still finds nothing", async () => {
    const client = makeClient({
      request: asRequest(makeRequestMock({ customerCreate: alreadyTaken })),
    });
    vi.mocked(shopifyLib.createShopifyClient).mockResolvedValue(client);

    const response = await onRequestPost(makeContext(validBody));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Email has already been taken",
    });
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

describe("onRequestPost rejecting invalid payloads", () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureMessage).mockClear();
    vi.mocked(shopifyLib.createShopifyClient).mockClear();
  });

  it("returns a 400 naming the email when it is malformed, without touching Shopify", async () => {
    const res = await onRequestPost(
      makeContext({ ...validBody, email: "jane@gmail" }),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Please enter a valid email address, like you@example.com.",
      invalidEmail: true,
    });
    expect(shopifyLib.createShopifyClient).not.toHaveBeenCalled();
  });

  it("returns the generic message when other fields are missing", async () => {
    const res = await onRequestPost(makeContext({ ...validBody, team: "" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "All fields are required" });
  });

  it("reports the rejection to Sentry as a warning with field names only", async () => {
    await onRequestPost(makeContext({ ...validBody, team: "" }));

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Contact form rejected: invalid team",
      "warning",
    );
  });

  it("does not report a bad email to Sentry, which is an ordinary visitor typo", async () => {
    await onRequestPost(makeContext({ ...validBody, email: "jane@gmail" }));

    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it("does not report honeypot rejections to Sentry", async () => {
    const res = await onRequestPost(
      makeContext({ ...validBody, website: "http://spam.test" }),
    );

    expect(res.status).toBe(400);
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });
});
