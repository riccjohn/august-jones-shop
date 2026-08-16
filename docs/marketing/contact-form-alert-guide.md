# Contact form email alert (Shopify Flow)

Every commission inquiry from the contact form creates a Draft Order in Shopify (Orders → Drafts) — see ADR-0002. Drafts are easy to miss since nothing else points at them, so this is a one-time Shopify Flow setup that emails you the moment a new one comes in.

Shopify Flow is free and included on your plan (Basic and up). It's usually pre-installed under **Apps** — if you don't see it, install "Shopify Flow" from the Shopify App Store.

## One-time setup

1. In Shopify admin, go to **Apps → Flow**.
2. Click **Create workflow**.
3. Add trigger: **Draft order created**.
4. Add a **Condition** step:
   - IF: **At least one of** `draft order / tags`
   - `Tags_item` → **Includes** → `contact-form`

   This makes sure the alert only fires for contact-form inquiries, not any draft order you create manually for other reasons.
5. On the **true** branch, add action: **Send internal email**.
   - **From:** leave as the default store contact email.
   - **To:** `customs@augustjones.shop` (or whichever inbox you check).
   - **Subject:** `New custom order inquiry — {{draftOrder.name}}` (click **Add variable** next to Subject to insert `draftOrder.name`).
   - **Message:**
     ```
     New custom order inquiry — {{draftOrder.name}}<br><br>
     <pre>{{draftOrder.note2}}</pre><br>
     View and price it here:<br>
     https://admin.shopify.com/store/august-jones-2/draft_orders/{{draftOrder.legacyResourceId}}
     ```
     Use **Add variable** to insert `draftOrder.note2` (the field holding all the form details) and `draftOrder.legacyResourceId` (the draft order's own ID — not the nested `draftOrder.order.legacyResourceId`, which stays empty until a draft is converted to a paid order and would give you a dead link).

     The Message field renders as HTML, which collapses plain line breaks into spaces — that's why `{{draftOrder.note2}}` needs to be wrapped in `<pre>...</pre>` (preserves the note's line breaks exactly) and the surrounding lines need explicit `<br>` tags.
6. Turn the workflow **On**.

## Testing it

Submit the contact form once (on the live site or a preview deploy pointed at the same Shopify store) and confirm the email arrives with the draft order details and a working link.

## Notes

- If the tag ever changes in code (`CONTACT_TAG` in `functions/api/contact.ts`), update the condition's tag value to match — Flow won't warn you if they drift apart, the workflow will just silently stop firing.
- Draft orders with no line items don't trigger Flow's "Draft order created" event — not a concern here, since every contact-form draft always has one custom line item.
- No equivalent alert exists yet for newsletter signups (`functions/api/subscribe.ts`) — those only create/update a Customer, not a draft order, so there's no natural Flow trigger for them the same way. If you want a similar alert for new subscribers, a Flow workflow on **Customer created** filtered to `tags includes "newsletter"` would work the same way.
