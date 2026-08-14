import type { PagesFunction } from "@cloudflare/workers-types";
import { Resend } from "resend";
import { jsonResponse } from "./_lib/json-response";
import { getStringField, isObject, isValidEmail } from "./_lib/validate";

interface Env {
  RESEND_API_KEY: string;
}

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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.json<unknown>();
  if (!isContactPayload(raw)) {
    return jsonResponse({ error: "All fields are required" }, 400);
  }
  const {
    firstName,
    lastName,
    email,
    instagram,
    team,
    pieceType,
    size,
    materialsSource,
    message,
    policyAgreed,
  } = raw;

  const resend = new Resend(context.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "August Jones <customs@augustjones.shop>",
    to: "customs+form@augustjones.shop",
    replyTo: email,
    subject: `[Contact] ${pieceType} — ${firstName} ${lastName}`,
    text: [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      `Instagram: ${instagram || "(not provided)"}`,
      `Team/University: ${team}`,
      `Piece Type: ${pieceType}`,
      `Size: ${size}`,
      `Materials: ${materialsSource}`,
      `Policy Agreed: ${policyAgreed ? "Yes" : "No"}`,
      "",
      "Description:",
      message || "(not provided)",
    ].join("\n"),
  });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
};
