import type { PagesFunction } from "@cloudflare/workers-types";
import {
  type ContactPayload,
  findInvalidContactFields,
  isContactPayload,
} from "./_lib/contact-validation";
import {
  caughtErrorResponse,
  errorResponse,
  rejectedInputResponse,
} from "./_lib/error-response";
import { jsonResponse } from "./_lib/json-response";
import {
  appendNote,
  type CustomerLookup,
  checkCustomerMutation,
  createShopifyClient,
  joinUserErrors,
  mergeTags,
  recoverTakenCustomer,
  type ShopifyClient,
  type ShopifyEnv,
} from "./_lib/shopify";

type Env = ShopifyEnv;

const CONTACT_TAG = "contact-form";

function buildContactNote(payload: ContactPayload): string {
  return [
    `Name: ${payload.firstName} ${payload.lastName}`,
    `Email: ${payload.email}`,
    `Instagram: ${payload.instagram || "(not provided)"}`,
    `Team/University: ${payload.team}`,
    `Piece Type: ${payload.pieceType}`,
    `Size: ${payload.size}`,
    `Materials: ${payload.materialsSource}`,
    `Policy Agreed: ${payload.policyAgreed ? "Yes" : "No"}`,
    "",
    "Description:",
    payload.message || "(not provided)",
  ].join("\n");
}

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

const DRAFT_ORDER_CREATE_MUTATION = `
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder { id }
      userErrors { field message }
    }
  }
`;

/**
 * Appends this submission's note and tag to a customer who already exists.
 * Deliberately leaves firstName/lastName alone — the form shouldn't overwrite
 * a name already on the account.
 */
async function updateContactCustomer(
  client: ShopifyClient,
  customer: CustomerLookup,
  note: string,
): Promise<{ customerId: string } | { error: string }> {
  const data = await client.request<{
    customerUpdate: UserErrorResult & { customer: { id: string } | null };
  }>(CUSTOMER_UPDATE_MUTATION, {
    input: {
      id: customer.id,
      note: appendNote(customer.note, note),
      tags: mergeTags(customer.tags, [CONTACT_TAG]),
    },
  });
  const result = checkCustomerMutation(data.customerUpdate);
  if ("error" in result) return { error: result.error };
  return { customerId: customer.id };
}

async function upsertContactCustomer(
  client: ShopifyClient,
  payload: ContactPayload,
  note: string,
): Promise<{ customerId: string } | { error: string }> {
  const existing = await client.findCustomerByEmail(payload.email);

  if (existing) {
    return updateContactCustomer(client, existing, note);
  }

  const data = await client.request<{
    customerCreate: UserErrorResult & { customer: { id: string } | null };
  }>(CUSTOMER_CREATE_MUTATION, {
    input: {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      note,
      tags: [CONTACT_TAG],
    },
  });
  const result = checkCustomerMutation(data.customerCreate);
  if ("error" in result) {
    // Same search-index race subscribe.ts handles: findCustomerByEmail reads
    // an index that lags behind writes, so a duplicate-email conflict here
    // means the customer does exist. Re-read by identity and update them
    // rather than losing the submission.
    const recovered = await recoverTakenCustomer(
      client,
      result.error,
      payload.email,
    );
    if (!recovered) return { error: result.error };
    return updateContactCustomer(client, recovered, note);
  }
  return { customerId: result.customer.id };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isContactPayload(raw)) {
    return rejectedInputResponse(
      "Contact form",
      findInvalidContactFields(raw),
      "All fields are required",
    );
  }

  const note = buildContactNote(raw);

  try {
    const client = await createShopifyClient(context.env);

    const customerResult = await upsertContactCustomer(client, raw, note);
    if ("error" in customerResult) {
      return errorResponse(customerResult.error);
    }

    const data = await client.request<{
      draftOrderCreate: UserErrorResult & {
        draftOrder: { id: string } | null;
      };
    }>(DRAFT_ORDER_CREATE_MUTATION, {
      input: {
        purchasingEntity: { customerId: customerResult.customerId },
        lineItems: [
          {
            title: `Custom ${raw.pieceType}`,
            quantity: 1,
            originalUnitPriceWithCurrency: {
              amount: "0.00",
              currencyCode: "USD",
            },
          },
        ],
        note,
        tags: [CONTACT_TAG],
      },
    });
    const error = joinUserErrors(data.draftOrderCreate.userErrors);
    if (error) {
      return errorResponse(error);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    return caughtErrorResponse(err);
  }
};
