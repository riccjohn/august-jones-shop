import * as Sentry from "@sentry/cloudflare";
import { jsonResponse } from "./json-response";

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
