"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

/**
 * Only a 400 carries a message meant for the visitor (the server saying which
 * input it rejected). Anything else may echo Shopify internals, so it is never
 * surfaced — callers fall back to their generic error copy.
 */
async function readRejectionMessage(res: Response): Promise<string | null> {
  if (res.status !== 400) return null;
  try {
    const body: unknown = await res.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      return typeof body.error === "string" ? body.error : null;
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
 * and errorMessage for a server-supplied rejection reason (null when generic).
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
