# Contact Form: Custom Commission Fields — Design

**Date:** 2026-08-12
**Status:** Approved, not yet implemented

> **Note (2026-08-16):** the backend details below (Resend) predate [ADR-0002](../../adr/0002-use-shopify-admin-api-for-contact-form-and-signup.md), which moved `functions/api/contact.ts` to the Shopify Admin API. Left as-is as a historical record of this feature's original design — the field/form design itself is still accurate.

## Goal

Replace the current minimal contact form (Name, Email, Message) with a structured custom-commission intake form that captures everything needed to scope and quote a commission, without adding a form library or client-side validation dependency.

## Current state

- `src/components/ContactForm.tsx` — uncontrolled form, `namedItem` field extraction on submit, native HTML `required` validation, honeypot anti-spam field, POSTs to `/api/contact`.
- `functions/api/contact.ts` — Cloudflare Pages Function. Validates a `ContactPayload` shape (`name`, `email`, `subject`, `message`, all required non-empty strings), sends via Resend to `customs+form@augustjones.shop` with `replyTo` set to the submitter's email.
- `src/components/ui/` currently has `button`, `input`, `label`, `select`, `textarea` — no `radio-group` or `checkbox`.

## Approach

Keep the existing uncontrolled-form pattern; do not introduce `react-hook-form`/`zod`. Rationale: the only genuinely dynamic behavior needed is one filter (piece type → size options), which one `useState` covers. Native HTML `required` validation is sufficient for the rest, consistent with how minimal the rest of this codebase is (YAGNI).

- Add one `useState<string>` for the selected piece type, used only to filter which size radio options render.
- Everything else stays uncontrolled; switch extraction on submit from individual `namedItem` calls to `new FormData(form)`, since the field count is going from 3 to 10.
- Validation stays native: `required` on inputs/selects, `required` on each radio input in a group, `required` on the checkbox.

## Fields

| Field | Type | Form field name | Required |
|---|---|---|---|
| First Name | text | `firstName` | yes |
| Last Name | text | `lastName` | yes |
| Email | email | `email` | yes |
| Instagram Handle | text | `instagram` | no |
| Team or University | text | `team` | yes |
| Piece Type | select | `pieceType` | yes |
| Size | radio | `size` | yes |
| Materials Source | radio | `materialsSource` | yes |
| Description | textarea | `message` | no |
| Deposit & Design Policy | checkbox | `policyAgreed` | yes |

### Piece Type options (value → label)

- `fanny-pack` → "Fanny Pack ($85–$115)"
- `cropped-flannel` → "Cropped Flannel ($110–$145)"
- `cropped-military-jacket` → "Cropped Military Jacket ($195–$245)"
- `full-length-military-jacket` → "Full Length Military Jacket ($195–$245)"
- `vest` → "Vest ($285–$350)"

### Size options (value → label)

- `one-size` → "One Size (Fanny Packs)"
- `unisex-s` → "Unisex S"
- `unisex-m` → "Unisex M"
- `unisex-l` → "Unisex L"
- `unisex-xl` → "Unisex XL"
- `custom-other` → "Custom / Other (Leave details in your description)"

**Dependent filtering (Piece Type → Size):**
- No piece type selected yet → show all size options (form shouldn't feel broken before a selection is made).
- `pieceType === "fanny-pack"` → show only `one-size` and `custom-other`.
- Any other piece type selected → show only `unisex-s`/`unisex-m`/`unisex-l`/`unisex-xl` and `custom-other` (hide `one-size`).
- If a previously-selected size becomes hidden by a new piece-type choice, clear that selection so an invalid combo can't be silently submitted.

### Materials Source options (value → label)

- `self` → "I am sending you my own garments/materials."
- `source` → "I want you to source the vintage materials for me."

### Deposit & Design Policy

Single required checkbox (not a select, despite how it was originally described), labeled with the full policy text:

> I have read below custom policy and I understand that if my custom design is accepted, a 50% non-refundable deposit is required to secure my spot before production begins.

## Backend changes (`functions/api/contact.ts`)

- Expand `ContactPayload` interface to: `firstName`, `lastName`, `email`, `instagram`, `team`, `pieceType`, `size`, `materialsSource`, `message`, `policyAgreed: boolean`.
- Update `isContactPayload` type guard: `instagram` and `message` may be empty strings; every other string field must be non-empty; `policyAgreed` must be `true`.
- Subject line: `` `[Contact] ${pieceTypeLabel} — ${firstName} ${lastName}` `` — use the human-readable piece type label (e.g. "Cropped Flannel"), not the raw kebab-case value.
- Email body: plain-text dump of all fields, `replyTo` still set to the submitted email.

## UI components

Two shadcn primitives need to be added (not currently in `src/components/ui/`):
- `pnpm dlx shadcn@latest add radio-group`
- `pnpm dlx shadcn@latest add checkbox`

## Layout

Mirrors the existing pattern (2-col grid rows on `sm:` breakpoint, full-width below):
1. First Name / Last Name — 2-col row
2. Email / Instagram Handle — 2-col row
3. Team or University — full width
4. Piece Type (select) — full width
5. Size (radio group) — full width
6. Materials Source (radio group) — full width
7. Description (textarea) — full width
8. Deposit & Design Policy (checkbox) — full width
9. Submit button (unchanged)

## Testing

`src/components/__tests__/ContactForm.test.tsx` needs a full rewrite of the `fillForm` test helper and payload assertions to match the new field set. Existing test structure (idle/submitting/success/error states, honeypot) stays the same in spirit — only the field-filling and payload-shape assertions change.

## Out of scope

- No new form validation library.
- No changes to the honeypot anti-spam mechanism.
- No changes to page-level copy/layout in `src/app/contact/page.tsx` beyond what's needed to render the expanded `<ContactForm />`.
