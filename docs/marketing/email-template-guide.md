# Sending an email to subscribers (Resend)

This is a step-by-step guide for sending a branded email to the "Website Signups" list — no code or technical knowledge needed. It uses a template that's already been set up to match the August Jones look (charcoal, eggshell, yellow, bold headlines).

**Important: use the Templates section, not Broadcasts, to set this up.** Templates is where Resend gives you the fill-in-the-blank "Variables" panel. If you paste this HTML directly into a Broadcast instead, you'll just see the raw `{{{...}}}` text with no way to edit it.

## One-time setup: create the template

You only need to do this once. If the template already exists in Resend, skip to **Sending an email** below.

1. Log in to [resend.com](https://resend.com) and go to **Templates** in the left sidebar (not Broadcasts).
2. Click **Create template**.
3. Open the file `docs/marketing/email-template.html` from this project (ask your developer for it if you don't have access), select all the text, and copy it.
4. Paste it into the Resend template editor (the HTML code editor view).
5. Open the **Variables** panel (top right). Set up four variables so they match the placeholder names already in the HTML — if they aren't auto-detected, click **+ Create variable** for each and type the name exactly as shown:
   - `HEADLINE` — text, no default needed, you'll fill this in each time.
   - `BODY_TEXT` — text, no default needed, you'll fill this in each time.
   - `CTA_TEXT` — text, default value: `Shop Now`
   - `CTA_URL` — text, default value: `https://store.augustjones.shop`
   - You do **not** need to create `RESEND_UNSUBSCRIBE_URL` as a variable — Resend recognizes that one automatically and fills it in per recipient.
6. Name the template something like **"August Jones — Standard Email"**.
7. Click **Publish**. (If you edit it later, you must publish again for changes to take effect on future sends.)

## Sending an email

1. In Resend, go to **Broadcasts** and click **Create broadcast**.
2. Choose the **audience/segment** you want to email — for a general announcement, that's **Website Signups**. This step matters beyond just picking recipients: the unsubscribe link in the footer only resolves correctly when a broadcast has an audience attached — skipping it can leave the unsubscribe link broken.
3. Select **August Jones — Standard Email** as the template.
4. Set the **From** address to `August Jones <hello@augustjones.shop>`. Don't reuse `customs@augustjones.shop` — that's the contact-form inbox for custom order inquiries, and mixing it with bulk marketing sends can hurt its deliverability if a broadcast ever gets spam complaints. Make sure `hello@augustjones.shop` is an inbox you actually check (or forward to your main email) — people do reply to these.
5. Fill in the four fields:
   - **HEADLINE** — short, punchy, all caps reads best (e.g. `NEW DROP: BEARS RESTORATION HOODIES`)
   - **BODY_TEXT** — a sentence or two about what's new or happening. Keep it short — this is a nudge to click through, not the full story.
   - **CTA_TEXT** — the button text (defaults to "Shop Now" — change it if it fits better, e.g. "See the Drop")
   - **CTA_URL** — where the button should link (defaults to the shop homepage — change it if linking to a specific product or collection)
6. Set the subject line (this is separate from the HEADLINE inside the email — keep it short, this is what shows in the inbox).
7. Use Resend's **Send test email** feature to send a copy to yourself first. Check it on your phone if you can — most people read email on mobile.
8. Once it looks right, click **Send** (or schedule it).

## Notes

- The footer's physical address and unsubscribe link are required by law and are already built into the template — don't remove them.
- If something looks broken after editing, it's safest to re-paste the original `email-template.html` and start the variable setup over rather than trying to fix HTML by hand.
- If, when creating a broadcast from this template, you don't see fields to fill in HEADLINE/BODY_TEXT/etc., look for a "Preview" or "Edit variables" option in the broadcast composer — the fill-in step happens there, separate from editing the template itself.
