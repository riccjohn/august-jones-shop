import * as Sentry from "@sentry/cloudflare";

interface Env {
  SENTRY_DSN: string;
}

/**
 * Installs Sentry for every function under `functions/` — both /api/contact and
 * /api/subscribe. Because it wraps all of them, a failure to initialize here
 * takes down both forms, not just one.
 *
 * Requires the `nodejs_compat` compatibility flag on Cloudflare Pages (the SDK
 * needs `node:async_hooks`), plus `SENTRY_DSN`, each set on Production and
 * Preview separately. Missing the flag is a runtime failure that a green deploy
 * does not catch. Setup, verification, and what Sentry does and doesn't report:
 * docs/sentry.md.
 */
export const onRequest = Sentry.sentryPagesPlugin<Env>((context) => ({
  dsn: context.env.SENTRY_DSN,
}));
