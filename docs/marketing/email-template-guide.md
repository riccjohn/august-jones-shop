# Sending an email to subscribers (Shopify Email)

This is a step-by-step guide for sending a branded email to your newsletter subscribers — no code or technical knowledge needed. It uses a template that's already set up to match the August Jones look (charcoal, eggshell, yellow, bold headlines) via Shopify Email's "Code your own" option.

## Finding your subscribers

Newsletter signups from the site (`functions/api/subscribe.ts`) create/update a Shopify Customer tagged `newsletter` with email marketing consent set to Subscribed — there's no separate "list" page. To target them:

1. Shopify admin → **Customers** → **Segments** → **Create segment**.
2. Filter: **Subscription status** → **Subscribed** (or use the filter `email_subscription_status = 'SUBSCRIBED'` directly in the segment editor).
3. Save it with a name like **"Website Signups"**. You only need to do this once — it's a live filter, so new subscribers are automatically included going forward.

## One-time setup: save the template

You don't strictly need to save a reusable template — you can paste the HTML fresh each time — but saving one means you don't have to re-copy the file every send.

1. Shopify admin → **Apps** → **Messaging** (this is Shopify Email's current home).
2. Click **Create campaign**.
3. Choose **Code your own** instead of a pre-built template.
4. Open the file `docs/marketing/email-template.html` from this project, select all the text, and copy it.
5. Paste it into the custom code editor.
6. Save this as a draft campaign named something like **"August Jones — Standard Email (template)"** and don't send it — treat it as your master copy to duplicate from, since Shopify Email doesn't have a separate "Templates" library.

## Sending an email

1. In **Apps → Messaging**, click **Create campaign** (or duplicate the saved template draft from above).
2. If starting fresh, choose **Code your own**, open `docs/marketing/email-template.html`, select all, copy, and paste it into the code editor.
3. Edit the HTML directly for this send:
   - Replace `REPLACE THIS HEADLINE WITH SOMETHING SHORT AND PUNCHY` with a short, punchy headline (e.g. `NEW DROP: BEARS RESTORATION HOODIES`). It's styled to display in caps regardless of how you type it.
   - Replace `REPLACE THIS BODY TEXT WITH A SENTENCE OR TWO ABOUT WHAT'S NEW.` with a sentence or two about what's new. Keep it short — this is a nudge to click through, not the full story.
   - The button label ("Shop Now") and its link (`<a href="https://store.augustjones.shop">`) are both in the same block of HTML — change the visible text and/or the `href` if this send needs to point somewhere other than the shop homepage.
4. Add a **Subject line** (separate field from the headline inside the email — keep it short, this is what shows in the inbox).
5. Under **Recipients**, select the **"Website Signups"** segment you created above (not "All subscribers", unless that's genuinely who you mean to reach).
6. Send yourself a **test email** first. Check it on your phone if you can — most people read email on mobile.
7. Once it looks right, review and send (or schedule).

## Notes

- The unsubscribe link is wired to Shopify's own `{{ unsubscribe_link }}` Liquid variable, which Shopify Email requires and auto-populates.
- Before sending, double-check the code editor doesn't still show the placeholder headline (`REPLACE THIS HEADLINE...`) or placeholder body text (`REPLACE THIS BODY TEXT...`).
- If something looks broken after editing, it's safest to re-paste the original `email-template.html` and start over rather than trying to fix HTML by hand.
- Custom-coded Shopify Email campaigns have a 500 KB size limit — this template is a few KB, so there's plenty of headroom even with edits.
