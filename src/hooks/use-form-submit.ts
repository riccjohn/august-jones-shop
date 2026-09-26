"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

/**
 * Only a 400 flagged `invalidEmail` carries a message meant for the visitor.
 * Every other rejection (a page bug, a bot) and any non-400 (which may echo
 * Shopify internals) is never surfaced — callers fall back to their generic
 * error copy, which includes the emailing fallback.
 */
async function readRejectionMessage(res: Response): Promise<string | null> {
  if (res.status !== 400) return null;
  try {
    const body: unknown = await res.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "invalidEmail" in body &&
      body.invalidEmail === true &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Body wasn't JSON; fall through to the generic message.
  }
  return null;
}

/**
 * Hook for managing form submission state and fetching.
 * Handles state transitions, error logging, and provides a submit function.
 * Also exposes setState for cases like honeypot handling that need to set state directly,
 * and errorMessage for a server-supplied bad-email message (null when generic).
 */
export function useFormSubmit(url: string) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(data: Record<string, unknown>): Promise<boolean> {
    setState("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setState("success");
        return true;
      } else {
        setErrorMessage(await readRejectionMessage(res));
        setState("error");
        return false;
      }
    } catch (error) {
      console.error(`Failed to submit form to ${url}:`, error);
      setState("error");
      return false;
    }
  }

  return { state, setState, errorMessage, submit };
}
