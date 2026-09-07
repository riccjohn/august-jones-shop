import * as Sentry from "@sentry/cloudflare";
import type { ShopifyEnv } from "./api/_lib/shopify";

interface Env extends ShopifyEnv {
  SENTRY_DSN: string;
}

/**
 * Installs Sentry for every function under `functions/api/` — /api/contact and
 * /api/subscribe, the only routes `functions/_routes.json` lets this middleware
 * see. Because it wraps both, a failure to initialize here takes down both
 * forms, not just one.
 *
 * Requires the `nodejs_compat` compatibility flag and `SENTRY_DSN`, each set on
 * Cloudflare Pages for Production and Preview separately — see docs/sentry.md
 * for setup, why the flag matters, verification, and what Sentry does and
 * doesn't report.
 *
 * `httpServerIntegration` is set to `maxRequestBodySize: "none"` because the
 * default ("medium") attaches the raw request body to every event regardless of
 * `sendDefaultPii` — which here would mean the full contact-form/signup payload
 * (name, email, message) shipping to Sentry on every routine Shopify rejection.
 */
export const onRequest = Sentry.sentryPagesPlugin<Env>((context) => ({
  dsn: context.env.SENTRY_DSN,
  integrations: [Sentry.httpServerIntegration({ maxRequestBodySize: "none" })],
}));
