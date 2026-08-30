import * as Sentry from "@sentry/cloudflare";

interface Env {
  SENTRY_DSN: string;
}

export const onRequest = Sentry.sentryPagesPlugin<Env>((context) => ({
  dsn: context.env.SENTRY_DSN,
}));
