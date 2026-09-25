import * as Sentry from "@sentry/cloudflare";
import { jsonResponse } from "./json-response";
import { INVALID_EMAIL_MESSAGE } from "./validate";

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g;

/**
 * Shopify userErrors/GraphQL messages sometimes echo the submitted value back
 * (e.g. "Email X is invalid"). Redacting it keeps that PII out of Sentry and,
 * as a side effect, keeps captureMessage's message-based grouping from
 * fragmenting one issue per submitted email.
 */
function redactPii(message: string): string {
  return message.replace(EMAIL_PATTERN, "[redacted-email]");
}

/** Reports an error (e.g. Shopify userErrors) to Sentry and returns a 500 JSON response. */
export function errorResponse(error: string): Response {
  Sentry.captureMessage(redactPii(error), "error");
  return jsonResponse({ error }, 500);
}

/** Reports a caught exception to Sentry and returns a 500 JSON response. */
export function caughtErrorResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : "Shopify request failed";
  if (err instanceof Error) {
    // Mutate in place, after reading `message` above for the client response:
    // the stack's first line is `${name}: ${message}`, so redacting only
    // `message` would leave the original text reappearing in the stack.
    err.message = redactPii(err.message);
    if (err.stack) err.stack = redactPii(err.stack);
  }
  Sentry.captureException(err);
  return jsonResponse({ error: message }, 500);
}

/**
 * Returns a 400 for a rejected submission. errorResponse only reports 500s, so
 * without a warning here a form the server keeps rejecting would be invisible.
 * The warning carries field names only, never submitted values, and is skipped
 * for the two expected cases: honeypot hits ("website") are bots working as
 * designed, and a lone bad email is an ordinary visitor typo.
 *
 * A lone bad email gets a specific message plus `invalidEmail: true`, the only
 * 400 the form shows the visitor. Anything else gets the generic
 * `fallbackError`, and the body names no fields (so a bot can't learn which
 * one tripped it).
 */
export function rejectedInputResponse(
  source: string,
  fields: string[],
  fallbackError: string,
): Response {
  const emailOnly = fields.length === 1 && fields[0] === "email";
  if (!emailOnly && !fields.includes("website")) {
    Sentry.captureMessage(
      `${source} rejected: invalid ${fields.join(", ")}`,
      "warning",
    );
  }
  if (emailOnly) {
    return jsonResponse(
      { error: INVALID_EMAIL_MESSAGE, invalidEmail: true },
      400,
    );
  }
  return jsonResponse({ error: fallbackError }, 400);
}
