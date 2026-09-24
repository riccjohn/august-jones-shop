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
 * Returns a 400 naming the rejected fields. errorResponse only reports 500s,
 * so without this a form the server keeps rejecting would be invisible.
 * Reports a Sentry warning — field names only, never submitted values —
 * except for honeypot hits ("website"), which are bots working as designed.
 * A lone bad email gets a specific message the form can show the visitor;
 * anything else gets `fallbackError`.
 */
export function rejectedInputResponse(
  source: string,
  fields: string[],
  fallbackError: string,
): Response {
  if (!fields.includes("website")) {
    Sentry.captureMessage(
      `${source} rejected: invalid ${fields.join(", ")}`,
      "warning",
    );
  }
  const emailOnly = fields.length === 1 && fields[0] === "email";
  return jsonResponse(
    { error: emailOnly ? INVALID_EMAIL_MESSAGE : fallbackError, fields },
    400,
  );
}
