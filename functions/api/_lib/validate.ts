/**
 * Checks if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Retrieves a string field from an object with type narrowing.
 * Returns the value if it's a non-empty string, undefined otherwise.
 */
export function getStringField(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = Reflect.get(obj, key);
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

/**
 * Basic email format validation: requires @ and a dot after it.
 * This catches obvious mistakes like "asdf" but doesn't validate RFCs strictly.
 */
export function isValidEmail(email: string): boolean {
  const atIndex = email.indexOf("@");
  if (atIndex < 1) return false;
  const afterAt = email.substring(atIndex + 1);
  return afterAt.includes(".");
}
