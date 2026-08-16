import type { PagesFunction } from "@cloudflare/workers-types";
import { jsonResponse } from "./_lib/json-response";
import {
  appendNote,
  createShopifyClient,
  joinUserErrors,
  mergeTags,
  type ShopifyEnv,
} from "./_lib/shopify";
import { getStringField, isObject, isValidEmail } from "./_lib/validate";

type Env = ShopifyEnv;

interface SubscribePayload {
  email: string;
  source: string;
  website?: string;
}

function isSubscribePayload(value: unknown): value is SubscribePayload {
  if (!isObject(value)) {
    return false;
  }

  const email = getStringField(value, "email");
  const source = getStringField(value, "source");

  if (!email || !source || !isValidEmail(email)) {
    return false;
  }

  // Reject if honeypot is filled (non-empty website field)
  const website = Reflect.get(value, "website");
  if (typeof website === "string" && website.length > 0) {
    return false;
  }

  return true;
}

const NEWSLETTER_TAG = "newsletter";

interface UserErrorResult {
  userErrors: { field: string[] | null; message: string }[];
}

const CUSTOMER_CREATE_MUTATION = `
  mutation CustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const CUSTOMER_UPDATE_MUTATION = `
  mutation CustomerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isSubscribePayload(raw)) {
    return jsonResponse({ error: "A valid email is required" }, 400);
  }
  const { email, source } = raw;

  const emailMarketingConsent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    // Required for Shopify's "Customer subscribed to email marketing" Flow
    // trigger (and built-in Welcome Series automations) to fire for
    // API-driven consent changes — it only fires when this is within 24h.
    consentUpdatedAt: new Date().toISOString(),
  };
  const note = `Newsletter signup source: ${source}`;

  try {
    const client = await createShopifyClient(context.env);
    const existing = await client.findCustomerByEmail(email);

    if (existing) {
      const data = await client.request<{
        customerUpdate: UserErrorResult & { customer: { id: string } | null };
      }>(CUSTOMER_UPDATE_MUTATION, {
        input: {
          id: existing.id,
          email,
          emailMarketingConsent,
          note: appendNote(existing.note, note),
          tags: mergeTags(existing.tags, [NEWSLETTER_TAG]),
        },
      });
      const error = joinUserErrors(data.customerUpdate.userErrors);
      if (error) {
        return jsonResponse({ error }, 500);
      }
    } else {
      const data = await client.request<{
        customerCreate: UserErrorResult & { customer: { id: string } | null };
      }>(CUSTOMER_CREATE_MUTATION, {
        input: {
          email,
          emailMarketingConsent,
          note,
          tags: [NEWSLETTER_TAG],
        },
      });
      const error = joinUserErrors(data.customerCreate.userErrors);
      if (error) {
        return jsonResponse({ error }, 500);
      }
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Shopify request failed";
    return jsonResponse({ error: message }, 500);
  }
};
