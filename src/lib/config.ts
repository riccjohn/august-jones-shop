/**
 * Customs Open/Closed Configuration
 *
 * Default: true (customs are open)
 * Override via NEXT_PUBLIC_CUSTOMS_OPEN=false in .env.local for testing
 *
 * Production (Cloudflare Pages) never sets this env var, so it always falls back
 * to the hardcoded constant. To toggle in production, commit a code change + push.
 */

const DEFAULT_CUSTOMS_OPEN = true;

export const CUSTOMS_OPEN =
  process.env.NEXT_PUBLIC_CUSTOMS_OPEN === undefined
    ? DEFAULT_CUSTOMS_OPEN
    : process.env.NEXT_PUBLIC_CUSTOMS_OPEN === "true";
