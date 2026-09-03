/**
 * Customs Open/Closed Configuration
 *
 * Default: true (customs are open)
 * Override via NEXT_PUBLIC_CUSTOMS_OPEN=false in .env.local for testing
 *
 * Production (Cloudflare Pages) never sets this env var, so it always falls back
 * to the hardcoded constant. To toggle in production, commit a code change + push.
 */

function parseBooleanFlag(
  envValue: string | undefined,
  defaultValue: boolean,
): boolean {
  return envValue === undefined ? defaultValue : envValue === "true";
}

const DEFAULT_CUSTOMS_OPEN = true;

export const CUSTOMS_OPEN = parseBooleanFlag(
  process.env.NEXT_PUBLIC_CUSTOMS_OPEN,
  DEFAULT_CUSTOMS_OPEN,
);

/**
 * Email Signup Configuration
 *
 * Default: false (signup forms hidden) — Shopify's Admin API intermittently
 * bot-challenges requests from Cloudflare Workers' shared egress IPs (see
 * issue #89), and /api/subscribe has no working fallback the way /contact
 * now does (#93 rerouted contact to Shopify's own custom-orders page — no
 * equivalent exists for newsletter signup). Hiding the forms avoids visitors
 * hitting a broken submit until that's resolved.
 * Override via NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED=true in .env.local for testing.
 *
 * Production (Cloudflare Pages) never sets this env var, so it always falls back
 * to the hardcoded constant. To toggle in production, commit a code change + push.
 */

const DEFAULT_EMAIL_SIGNUP_ENABLED = false;

export const EMAIL_SIGNUP_ENABLED = parseBooleanFlag(
  process.env.NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED,
  DEFAULT_EMAIL_SIGNUP_ENABLED,
);
