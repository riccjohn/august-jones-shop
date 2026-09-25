import {
  INVALID_EMAIL_MESSAGE,
  isValidEmail,
} from "../../functions/api/_lib/validate";

/**
 * The browser accepts "jane@gmail" in an <input type="email"> but the server
 * doesn't, so apply the server's rule as custom validity: the mistake is
 * caught next to the field, before anything is sent. An empty field is left to
 * `required`, so the browser's own "fill out this field" message shows.
 */
function syncEmailValidity(input: HTMLInputElement) {
  const ok = input.value === "" || isValidEmail(input.value);
  input.setCustomValidity(ok ? "" : INVALID_EMAIL_MESSAGE);
}

/** onChange handler for an <input type="email">. */
export function applyEmailValidity(e: React.ChangeEvent<HTMLInputElement>) {
  syncEmailValidity(e.currentTarget);
}

/**
 * Submit-time backstop for values set without a change event (some autofill
 * and restore paths). Re-checks the form's email field and, if it's bad, shows
 * the browser's validation bubble. Returns true when submission should stop.
 */
export function blockInvalidEmail(form: HTMLFormElement): boolean {
  const input = form.elements.namedItem("email");
  if (!(input instanceof HTMLInputElement)) return false;
  syncEmailValidity(input);
  if (input.validity.valid) return false;
  form.reportValidity();
  return true;
}
