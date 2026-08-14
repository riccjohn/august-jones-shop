# Sending an email to subscribers (Resend)

This is a step-by-step guide for sending a branded email to the "Website Signups" list — no code or technical knowledge needed. It uses a template that's already been set up to match the August Jones look (charcoal, eggshell, yellow, bold headlines).

**Important: use the Templates section, not Broadcasts, to set this up.** Templates is where Resend gives you the fill-in-the-blank "Variables" panel. If you paste this HTML directly into a Broadcast instead, you'll just see the raw `{{{...}}}` text with no way to edit it.

## One-time setup: create the template

You only need to do this once. If the template already exists in Resend, skip to **Sending an email** below.

1. Log in to [resend.com](https://resend.com) and go to **Templates** in the left sidebar (not Broadcasts).
2. Click **Create template**.
3. Open the file `docs/marketing/email-template.html` from this project (ask your developer for it if you don't have access), select all the text, and copy it.
4. Paste it into the Resend template editor (the HTML code editor view).
5. Open the **Variables** panel (top right). Set up two variables so they match the placeholder names already in the HTML — if they aren't auto-detected, click **+ Create variable** for each and type the name exactly as shown:
   - `HEADLINE` — text, no fallback needed, you'll fill this in each time.
   - `BODY_TEXT` — text, no fallback needed, you'll fill this in each time.
   - You do **not** need to create `RESEND_UNSUBSCRIBE_URL` as a variable — Resend recognizes that one automatically and fills it in per recipient.
   - The "Shop Now" button isn't a variable — it's plain text/link baked into the template, since it's almost always the same. See step 5 below for how to change it on the rare broadcast where it needs to be different.
6. Name the template something like **"August Jones — Standard Email"**.
7. Click **Publish**. (If you edit it later, you must publish again for changes to take effect on future sends.)

## Sending an email

1. In Resend, go to **Broadcasts** and click **Create broadcast**.
2. Choose the **audience/segment** you want to email — for a general announcement, that's **Website Signups**. This step matters beyond just picking recipients: the unsubscribe link in the footer only resolves correctly when a broadcast has an audience attached — skipping it can leave the unsubscribe link broken.
3. Select **August Jones — Standard Email** as the template.
4. Set the **From** address to `August Jones <hello@augustjones.shop>`. Don't reuse `customs@augustjones.shop` — that's the contact-form inbox for custom order inquiries, and mixing it with bulk marketing sends can hurt its deliverability if a broadcast ever gets spam complaints. Make sure `hello@augustjones.shop` is an inbox you actually check (or forward to your main email) — people do reply to these.
5. Fill in the two variable fields. Creating the broadcast from the template makes its own independent copy of the variables — it does **not** carry over the values you set on the Template, so this step is required every time:
   - In the email preview area, click directly on each `{{{...}}}` block (you'll see one for HEADLINE and one for BODY_TEXT — each shows a small warning triangle until it's filled in). Clicking always opens a side panel — there's no way to edit these two in place.
   - The panel has one field: **Fallback value**. Ignore the name — in Resend's dashboard (as opposed to sending via their API/code), there is no separate "real value" field. Fallback value is the only place Resend stores this variable's text, so whatever you type there is exactly what gets sent:
     - `HEADLINE` — short, punchy, all caps reads best (e.g. `NEW DROP: BEARS RESTORATION HOODIES`)
     - `BODY_TEXT` — a sentence or two about what's new or happening. Keep it short — this is a nudge to click through, not the full story.
   - If this particular email should link somewhere other than the shop homepage, or the button should say something other than "Shop Now" (e.g. "See the Drop"), click directly on the button text in the preview and type over it — unlike the two variables above, this is plain text, so it edits in place just like any other word in the email.
6. Set the subject line (this is separate from the HEADLINE inside the email — keep it short, this is what shows in the inbox).
7. Use Resend's **Send test email** feature to send a copy to yourself first. Check it on your phone if you can — most people read email on mobile.
8. Once it looks right, click **Send** (or schedule it).

## Notes

- The footer's physical address and unsubscribe link are required by law and are already built into the template — don't remove them.
- If something looks broken after editing, it's safest to re-paste the original `email-template.html` and start the variable setup over rather than trying to fix HTML by hand.
- Before sending, check the preview for any leftover `{{{...}}}` text with a warning triangle — that means a variable's Fallback value on this broadcast is still empty and needs to be filled in.
