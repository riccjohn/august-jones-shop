# Welcome email automation (Resend)

This is a one-time setup for an automatic email that goes out the moment someone joins the "Website Signups" list — no per-send work required afterward, unlike the broadcast email.

**Trigger mechanism:** Resend's Automations only offer a "Custom Event" trigger — there's no built-in "contact added to audience" trigger. So the site's signup code (`functions/api/subscribe.ts`) fires a custom event named `newsletter.subscribed` right after adding someone to the list. The Automation you set up below listens for that exact event name.

## One-time setup

1. Log in to [resend.com](https://resend.com) and go to **Templates** in the left sidebar.
2. Click **Create template**.
3. Open the file `docs/marketing/welcome-email.html` from this project, select all the text, and copy it.
4. Paste it into the Resend template editor (the HTML code editor view).
5. Name the template **"August Jones — Welcome Email"**.
6. Click **Publish**. Automations can only use published templates — if you edit the template later, you must publish again.
7. Go to **Automations** in the left sidebar and click **Create automation**.
8. Add a **trigger** step, choose **Custom Event**, and enter the event name exactly as:
   ```
   newsletter.subscribed
   ```
9. Add a **Send Email** step after the trigger, and select the **"August Jones — Welcome Email"** template.
10. (Optional) Add a short delay before the send step — a few minutes feels less like an auto-responder than an instant send.
11. Publish the automation.

## Testing it

Submit the signup form on the live site (or on a preview deploy pointed at the same Resend account) with an email you control, and confirm the welcome email arrives. There's no "send test" button for automations the way there is for broadcasts — the only way to see it fire is to actually trigger the event.

## Notes

- Don't rename the event without updating both places: the string literal in `functions/api/subscribe.ts` and the trigger config in the Automation. They won't warn you if they drift apart — the automation will just silently stop firing.
- If the automation doesn't fire, check the **Events** log in the Resend dashboard first (under Automations) — it shows every event received, which narrows down whether the problem is the code not sending the event, or the automation trigger not matching it.
- The footer's physical address and unsubscribe link are required by law and are already built into the template — don't remove them.
