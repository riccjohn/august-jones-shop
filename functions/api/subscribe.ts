import type { PagesFunction } from "@cloudflare/workers-types";
import { Resend } from "resend";
import { jsonResponse } from "./_lib/json-response";
import { getStringField, isObject, isValidEmail } from "./_lib/validate";

interface Env {
  RESEND_API_KEY: string;
  RESEND_SEGMENT_ID: string;
}

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isSubscribePayload(raw)) {
    return jsonResponse({ error: "A valid email is required" }, 400);
  }
  const { email } = raw;

  const resend = new Resend(context.env.RESEND_API_KEY);

  const { error } = await resend.contacts.create({
    email,
    segments: [{ id: context.env.RESEND_SEGMENT_ID }],
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
};
