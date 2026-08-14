# Sending an email to subscribers (Resend)

This is a step-by-step guide for sending a branded email to the "Website Signups" list — no code or technical knowledge needed. `docs/marketing/email-template.html` is a ready-made design that matches the August Jones look (charcoal, eggshell, yellow, bold headlines) with clearly-marked placeholder text you swap out before each send.

## Sending an email

1. Log in to [resend.com](https://resend.com) and go to **Broadcasts** → **Create broadcast**.
2. Choose the **audience/segment** you want to email — for a general announcement, that's **Website Signups**.
3. Open the HTML code editor (the `</>` icon). Open the file `docs/marketing/email-template.html` from this project (ask your developer for it if you don't have access), select all the text, and copy it. Paste it into the code editor, replacing whatever's there.
4. In the code editor, find and replace three spots directly in the code — click right before/after the text and retype over it, the same way you'd edit text in a document:
   - `YOUR HEADLINE HERE` → your real headline (short, punchy, all caps reads best — e.g. `NEW DROP: BEARS RESTORATION HOODIES`)
   - `Your email copy goes here. A sentence or two...` → a sentence or two about what's new. Keep it short — this is a nudge to click through, not the full story.
   - `Shop Now` (inside the yellow button, near the bottom) → change only if a more specific label fits better, e.g. `See the Drop`. If you're linking somewhere other than the shop homepage, also change the `https://store.augustjones.shop` link right next to it — just the text between the quotes, don't touch the quotes themselves.
   - There's also a **pencil icon** next to `</>` at the top of the editor — try it. It may switch to a visual, point-and-click view where you can click directly on the rendered text instead of editing raw code.
5. Set the subject line (this is separate from the headline inside the email — keep it short, this is what shows in the inbox).
6. Use Resend's **Send test email** feature to send a copy to yourself first. Check it on your phone if you can — most people read email on mobile.
7. Once it looks right, click **Send** (or schedule it).

## Notes

- The footer's physical address and unsubscribe link are required by law and are already built into the template — don't remove them. The `{{{RESEND_UNSUBSCRIBE_URL}}}` text you'll see in the code is not a placeholder to edit — leave it exactly as-is, Resend fills it in automatically per recipient.
- If something looks broken after editing, it's safest to re-copy the original `email-template.html` and start over rather than trying to fix broken HTML by hand.
- Want to avoid re-pasting the HTML every time? In Resend, open the **more options** menu on a sent (or draft) broadcast and choose **Clone as template** — that saves this design as a reusable starting point in **Templates**, so future broadcasts can start from it instead of a blank editor. You'll still edit the same three placeholder spots directly in the code each time.
