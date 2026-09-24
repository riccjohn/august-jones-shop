import {
  INVALID_EMAIL_MESSAGE,
  isValidEmail,
} from "../../functions/api/_lib/validate";

/**
 * onChange handler for an <input type="email">. The browser accepts
 * "jane@gmail" but the server doesn't, so apply the server's rule as custom
 * validity: the mistake is caught next to the field, before anything is sent.
 */
export function applyEmailValidity(e: React.ChangeEvent<HTMLInputElement>) {
  e.currentTarget.setCustomValidity(
    isValidEmail(e.currentTarget.value) ? "" : INVALID_EMAIL_MESSAGE,
  );
}
