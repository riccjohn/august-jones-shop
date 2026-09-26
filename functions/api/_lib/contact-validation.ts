/**
 * Pure, Cloudflare-types-free by design (unlike contact.ts) so it can be
 * imported from src/ tests to check ContactForm's real POST body against it
 * — the root tsconfig has no @cloudflare/workers-types wiring, and pulling
 * that in via contact.ts's PagesFunction/Response usage breaks `tsc` at the
 * root. Keep this file free of Cloudflare-specific types.
 */

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
 * Names the fields that make `value` an invalid contact payload, in form
 * order. Empty means valid. A body that isn't an object at all is reported as
 * "payload"; a filled honeypot is reported as "website". Only names are
 * returned — never submitted values — so the result is safe to log.
 */
export function findInvalidContactFields(value: unknown): string[] {
  if (!isObject(value)) {
    return ["payload"];
  }

  const email = getStringField(value, "email");
  const checks: [string, boolean][] = [
    ["firstName", Boolean(getStringField(value, "firstName"))],
    ["lastName", Boolean(getStringField(value, "lastName"))],
    ["email", Boolean(email && isValidEmail(email))],
    ["instagram", typeof Reflect.get(value, "instagram") === "string"],
    ["team", Boolean(getStringField(value, "team"))],
    ["pieceType", Boolean(getStringField(value, "pieceType"))],
    ["size", Boolean(getStringField(value, "size"))],
    ["materialsSource", Boolean(getStringField(value, "materialsSource"))],
    ["message", typeof Reflect.get(value, "message") === "string"],
    ["policyAgreed", Reflect.get(value, "policyAgreed") === true],
  ];
  const invalid = checks.filter(([, ok]) => !ok).map(([name]) => name);

  // Reject if honeypot is filled (non-empty website field)
  const website = Reflect.get(value, "website");
  if (typeof website === "string" && website.length > 0) {
    invalid.push("website");
  }

  return invalid;
}

export function isContactPayload(value: unknown): value is ContactPayload {
  return findInvalidContactFields(value).length === 0;
}
