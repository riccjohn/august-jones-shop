import * as Sentry from "@sentry/cloudflare";
import { jsonResponse } from "./json-response";

/** Reports an error (e.g. Shopify userErrors) to Sentry and returns a 500 JSON response. */
export function errorResponse(error: string): Response {
  Sentry.captureMessage(error, "error");
  return jsonResponse({ error }, 500);
}

/** Reports a caught exception to Sentry and returns a 500 JSON response. */
export function caughtErrorResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : "Shopify request failed";
  Sentry.captureException(err);
  return jsonResponse({ error: message }, 500);
}
