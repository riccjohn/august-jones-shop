import type { PagesFunction } from "@cloudflare/workers-types";
import { caughtErrorResponse, errorResponse } from "./_lib/error-response";
import { jsonResponse } from "./_lib/json-response";
import {
  appendNote,
  type CustomerLookup,
  checkCustomerMutation,
  createShopifyClient,
  mergeTags,
  recoverTakenCustomer,
  type ShopifyClient,
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

// Shopify's Admin API no longer accepts `emailMarketingConsent` on
// customerUpdate ("To update emailMarketingConsent, please use the
// customerEmailMarketingConsentUpdate Mutation instead") — it's still
// accepted on customerCreate, just not on update. So the existing-customer
// path is two mutations: plain customerUpdate, then this dedicated one.
const CUSTOMER_UPDATE_MUTATION = `
  mutation CustomerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const CUSTOMER_EMAIL_MARKETING_CONSENT_UPDATE_MUTATION = `
  mutation CustomerEmailMarketingConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

interface EmailMarketingConsent {
  marketingState: "SUBSCRIBED";
  marketingOptInLevel: "SINGLE_OPT_IN";
  consentUpdatedAt: string;
}

/**
 * Subscribes an existing customer: newsletter consent first, then the note
 * and tag. Two sequential mutations because Shopify's customerUpdate rejects
 * `emailMarketingConsent` — consent must go through the dedicated
 * customerEmailMarketingConsentUpdate mutation instead.
 *
 * Consent leads deliberately. Either call can fail on its own, and consent is
 * what the visitor actually asked for; the note and tag are bookkeeping. The
 * order also keeps a retry clean: re-applying consent is idempotent, while
 * appendNote is not, so updating first would stack a duplicate note onto the
 * customer every time a visitor resubmitted after a consent failure.
 */
async function subscribeExistingCustomer(
  client: ShopifyClient,
  customer: CustomerLookup,
  email: string,
  note: string,
  emailMarketingConsent: EmailMarketingConsent,
): Promise<{ error: string } | { ok: true }> {
  const consentData = await client.request<{
    customerEmailMarketingConsentUpdate: UserErrorResult & {
      customer: { id: string } | null;
    };
  }>(CUSTOMER_EMAIL_MARKETING_CONSENT_UPDATE_MUTATION, {
    input: { customerId: customer.id, emailMarketingConsent },
  });
  const consentResult = checkCustomerMutation(
    consentData.customerEmailMarketingConsentUpdate,
  );
  if ("error" in consentResult) {
    return consentResult;
  }

  const updateData = await client.request<{
    customerUpdate: UserErrorResult & { customer: { id: string } | null };
  }>(CUSTOMER_UPDATE_MUTATION, {
    input: {
      id: customer.id,
      email,
      note: appendNote(customer.note, note),
      tags: mergeTags(customer.tags, [NEWSLETTER_TAG]),
    },
  });
  const updateResult = checkCustomerMutation(updateData.customerUpdate);
  if ("error" in updateResult) {
    return updateResult;
  }

  return { ok: true };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isSubscribePayload(raw)) {
    return jsonResponse({ error: "A valid email is required" }, 400);
  }
  const { email, source } = raw;

  const emailMarketingConsent: EmailMarketingConsent = {
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
      const result = await subscribeExistingCustomer(
        client,
        existing,
        email,
        note,
        emailMarketingConsent,
      );
      if ("error" in result) {
        return errorResponse(result.error);
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
      const result = checkCustomerMutation(data.customerCreate);
      if ("error" in result) {
        // A duplicate-email conflict here means the customer exists despite
        // findCustomerByEmail finding nothing moments ago — its search index
        // lags behind writes. recoverTakenCustomer re-reads by identity
        // instead, so we can fall back to updating them.
        const recovered = await recoverTakenCustomer(
          client,
          result.error,
          email,
        );
        if (!recovered) {
          return errorResponse(result.error);
        }
        const recoveredResult = await subscribeExistingCustomer(
          client,
          recovered,
          email,
          note,
          emailMarketingConsent,
        );
        if ("error" in recoveredResult) {
          return errorResponse(recoveredResult.error);
        }
      }
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    return caughtErrorResponse(err);
  }
};
