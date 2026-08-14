import type { PagesFunction } from "@cloudflare/workers-types";
import { Resend } from "resend";
import { jsonResponse } from "./_lib/json-response";

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
}

function isContactPayload(value: unknown): value is ContactPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const firstName = Reflect.get(value, "firstName");
  const lastName = Reflect.get(value, "lastName");
  const email = Reflect.get(value, "email");
  const instagram = Reflect.get(value, "instagram");
  const team = Reflect.get(value, "team");
  const pieceType = Reflect.get(value, "pieceType");
  const size = Reflect.get(value, "size");
  const materialsSource = Reflect.get(value, "materialsSource");
  const message = Reflect.get(value, "message");
  const policyAgreed = Reflect.get(value, "policyAgreed");

  return (
    typeof firstName === "string" &&
    typeof lastName === "string" &&
    typeof email === "string" &&
    typeof instagram === "string" &&
    typeof team === "string" &&
    typeof pieceType === "string" &&
    typeof size === "string" &&
    typeof materialsSource === "string" &&
    typeof message === "string" &&
    typeof policyAgreed === "boolean" &&
    Boolean(
      firstName &&
        lastName &&
        email &&
        team &&
        pieceType &&
        size &&
        materialsSource &&
        policyAgreed,
    )
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
