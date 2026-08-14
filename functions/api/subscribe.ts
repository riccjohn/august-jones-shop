import type { PagesFunction } from "@cloudflare/workers-types";
import { Resend } from "resend";

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
    return new Response(
      JSON.stringify({ error: "A valid email is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const { email } = raw;

  const resend = new Resend(context.env.RESEND_API_KEY);

  const { error } = await resend.contacts.create({
    email,
    segments: [{ id: context.env.RESEND_SEGMENT_ID }],
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
