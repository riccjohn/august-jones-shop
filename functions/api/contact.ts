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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await context.request.json<ContactPayload>();
  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return new Response(JSON.stringify({ error: "All fields are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
