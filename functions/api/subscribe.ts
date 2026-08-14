import type { PagesFunction } from "@cloudflare/workers-types";
import { Resend } from "resend";
import { jsonResponse } from "./_lib/json-response";

interface Env {
  RESEND_API_KEY: string;
  RESEND_SEGMENT_ID: string;
}

interface SubscribePayload {
  email: string;
}

function isSubscribePayload(value: unknown): value is SubscribePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const email = Reflect.get(value, "email");

  return typeof email === "string" && Boolean(email);
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
