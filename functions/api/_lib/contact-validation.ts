import { getStringField, isObject, isValidEmail } from "./validate";

export interface ContactPayload {
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

/**
 * Pure, Cloudflare-types-free by design (unlike contact.ts) so it can be
 * imported from src/ tests to check ContactForm's real POST body against it
 * — the root tsconfig has no @cloudflare/workers-types wiring, and pulling
 * that in via contact.ts's PagesFunction/Response usage breaks `tsc` at the
 * root. Keep this file free of Cloudflare-specific types.
 */
export function isContactPayload(value: unknown): value is ContactPayload {
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

  return Boolean(
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
      policyAgreed === true,
  );
}
