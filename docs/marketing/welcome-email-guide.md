# Welcome email automation (Shopify Marketing Automations)

This is a one-time setup for an automatic email that goes out the moment someone joins the newsletter — no per-send work required afterward, unlike the broadcast email (see `email-template-guide.md`).

**Trigger mechanism:** newsletter signups (`functions/api/subscribe.ts`) set the customer's email marketing consent to Subscribed via the Admin API, including a `consentUpdatedAt` timestamp — that's what makes Shopify's built-in **Customer subscribed to email marketing** trigger fire for signups coming from our own code, not just an on-site form embed. That unlocks Shopify's native Welcome Series automation templates directly — no custom Flow workflow needed.

## One-time setup

1. Shopify admin → **Apps** → **Messaging** → **Automations**.
2. Find a **Welcome** template — Shopify offers prebuilt options like "Welcome new subscriber" (single email) or a multi-email "Welcome series" (with or without a discount code). Pick whichever matches how you want to greet new subscribers.
3. Click to customize it. This uses the same block-based editor as campaigns (see `email-template-guide.md`) — you can either use the visual blocks with your brand colors/logo, or choose **Code your own** and paste in `docs/marketing/welcome-email.html` for pixel-matched branding.
4. If the template includes a discount step and you don't want to offer one yet, remove or disable that email in the series.
5. Turn the automation **On**.

## Testing it

Submit the newsletter signup form (footer or `/join`) on the live site or a preview deploy pointed at the same Shopify store, using an email you control, and confirm the welcome email arrives. It may take a few minutes — this isn't instant the way the contact-form Flow alert is.

## Notes

- If nothing arrives, check the automation's **Activity** tab in Shopify admin — it shows every time the trigger fired, which narrows down whether the problem is the trigger not firing (check that `functions/api/subscribe.ts` is actually setting `consentUpdatedAt`) versus the email step itself failing.
- The footer's physical address and unsubscribe link are required by law — if you use `welcome-email.html` via "Code your own," they're already built in; if you use the visual block editor instead, Shopify adds them automatically.
- This trigger only fires when `consentUpdatedAt` is within the last 24 hours of the request — our code always sets it to "now," so this should never be an issue in practice, but it's why this wouldn't work if someone tried to backfill historical subscribers through the same code path.
