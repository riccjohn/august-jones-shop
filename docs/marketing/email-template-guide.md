# Sending an email to subscribers (Resend)

This is a step-by-step guide for sending a branded email to the "Website Signups" list — no code or technical knowledge needed. It uses a template that's already been set up to match the August Jones look (charcoal, eggshell, yellow, bold headlines).

**Note:** this template does not use Resend's "Variables" feature. It was tried and doesn't work reliably in the dashboard — the Fallback value field doesn't actually control what gets sent, and the output can still show raw `{{ VARIABLE }}` text. Instead, the headline and body text are plain placeholder text you edit directly in the preview, the same way the "Shop Now" button text already works.

## One-time setup: create the template

You only need to do this once. If the template already exists in Resend, skip to **Sending an email** below.

1. Log in to [resend.com](https://resend.com) and go to **Templates** in the left sidebar (not Broadcasts). Using a saved Template just saves you from re-pasting the whole HTML file every time you send — it's not required for the editing steps below to work.
2. Click **Create template**.
3. Open the file `docs/marketing/email-template.html` from this project (ask your developer for it if you don't have access), select all the text, and copy it.
4. Paste it into the Resend template editor (the HTML code editor view).
5. Name the template something like **"August Jones — Standard Email"**.
6. Click **Publish**. (If you edit it later, you must publish again for changes to take effect on future sends.)

## Sending an email

1. In Resend, go to **Broadcasts** and click **Create broadcast**.
2. Choose the **audience/segment** you want to email — for a general announcement, that's **Website Signups**. This step matters beyond just picking recipients: the unsubscribe link in the footer only resolves correctly when a broadcast has an audience attached — skipping it can leave the unsubscribe link broken.
3. Select **August Jones — Standard Email** as the template.
4. Set the **From** address to `August Jones <hello@augustjones.shop>`. Don't reuse `customs@augustjones.shop` — that's the contact-form inbox for custom order inquiries, and mixing it with bulk marketing sends can hurt its deliverability if a broadcast ever gets spam complaints. Make sure `hello@augustjones.shop` is an inbox you actually check (or forward to your main email) — people do reply to these.
5. In the email preview area, click directly on each piece of text you need to change and type over it — this edits in place, no side panel:
   - The headline (shows as `REPLACE ME — SHORT, PUNCHY HEADLINE`) — short, punchy, all caps reads best (e.g. `NEW DROP: BEARS RESTORATION HOODIES`). It's forced to display in caps regardless of how you type it.
   - The body text (shows as `REPLACE THIS BODY TEXT WITH A SENTENCE OR TWO ABOUT WHAT'S NEW.`) — a sentence or two about what's new or happening. Keep it short — this is a nudge to click through, not the full story.
   - If this particular email should link somewhere other than the shop homepage, or the button should say something other than "Shop Now" (e.g. "See the Drop"), click directly on the button text in the preview and type over it too.
6. Set the subject line (this is separate from the headline inside the email — keep it short, this is what shows in the inbox).
7. Use Resend's **Send test email** feature to send a copy to yourself first. Check it on your phone if you can — most people read email on mobile.
8. Once it looks right, click **Send** (or schedule it).

## Notes

- The footer's physical address and unsubscribe link are required by law and are already built into the template — don't remove them.
- Before sending, double-check the preview doesn't still show the placeholder headline (`REPLACE ME...`) or placeholder body text (`REPLACE THIS BODY TEXT...`) — it's easy to miss since there's no warning triangle like Resend's Variables feature normally shows.
- If something looks broken after editing, it's safest to re-paste the original `email-template.html` and start over rather than trying to fix HTML by hand.
