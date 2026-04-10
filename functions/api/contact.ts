import type { PagesFunction } from "@cloudflare/workers-types";
import { Resend } from "resend";

interface Env {
  RESEND_API_KEY: string;
}

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function isContactPayload(value: unknown): value is ContactPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const name = Reflect.get(value, "name");
  const email = Reflect.get(value, "email");
  const subject = Reflect.get(value, "subject");
  const message = Reflect.get(value, "message");
  return (
    typeof name === "string" &&
    typeof email === "string" &&
    typeof subject === "string" &&
    typeof message === "string" &&
    Boolean(name && email && subject && message)
  );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isContactPayload(raw)) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { name, email, subject, message } = raw;

  const resend = new Resend(context.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "August Jones <customs@augustjones.shop>",
    to: "customs@augustjones.shop",
    replyTo: email,
    subject: `[Contact] ${subject} — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
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
