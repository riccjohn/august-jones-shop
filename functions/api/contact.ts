import type { PagesFunction } from "@cloudflare/workers-types";
import { caughtErrorResponse, errorResponse } from "./_lib/error-response";
import { jsonResponse } from "./_lib/json-response";
import {
  appendNote,
  createShopifyClient,
  joinUserErrors,
  mergeTags,
  type ShopifyClient,
  type ShopifyEnv,
} from "./_lib/shopify";
import { getStringField, isObject, isValidEmail } from "./_lib/validate";

type Env = ShopifyEnv;

interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  instagram: string;
  team: string;
  pieceType: string;
  size: string;
  materialsSource: string;
  message: string;
  policyAgreed: boolean;
  website?: string;
}

function isContactPayload(value: unknown): value is ContactPayload {
  if (!isObject(value)) {
    return false;
  }

  const firstName = getStringField(value, "firstName");
  const lastName = getStringField(value, "lastName");
  const email = getStringField(value, "email");
  const instagram = Reflect.get(value, "instagram");
  const team = getStringField(value, "team");
  const pieceType = getStringField(value, "pieceType");
  const size = getStringField(value, "size");
  const materialsSource = getStringField(value, "materialsSource");
  const message = Reflect.get(value, "message");
  const policyAgreed = Reflect.get(value, "policyAgreed");

  // Reject if honeypot is filled (non-empty website field)
  const website = Reflect.get(value, "website");
  if (typeof website === "string" && website.length > 0) {
    return false;
  }

  return (
    firstName &&
    lastName &&
    email &&
    isValidEmail(email) &&
    typeof instagram === "string" &&
    team &&
    pieceType &&
    size &&
    materialsSource &&
    typeof message === "string" &&
    policyAgreed === true
  );
}

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

async function upsertContactCustomer(
  client: ShopifyClient,
  payload: ContactPayload,
  note: string,
): Promise<{ customerId: string } | { error: string }> {
  const existing = await client.findCustomerByEmail(payload.email);

  if (existing) {
    const data = await client.request<{
      customerUpdate: UserErrorResult & { customer: { id: string } | null };
    }>(CUSTOMER_UPDATE_MUTATION, {
      input: {
        id: existing.id,
        note: appendNote(existing.note, note),
        tags: mergeTags(existing.tags, [CONTACT_TAG]),
      },
    });
    const error = joinUserErrors(data.customerUpdate.userErrors);
    if (error) return { error };
    return { customerId: existing.id };
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
  const error = joinUserErrors(data.customerCreate.userErrors);
  if (error) return { error };
  if (!data.customerCreate.customer) {
    return { error: "Shopify did not return a customer" };
  }
  return { customerId: data.customerCreate.customer.id };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isContactPayload(raw)) {
    return jsonResponse({ error: "All fields are required" }, 400);
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
