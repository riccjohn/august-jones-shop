"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

/**
 * Hook for managing form submission state and fetching.
 * Handles state transitions, error logging, and provides a submit function.
 * Also exposes setState for cases like honeypot handling that need to set state directly.
 */
export function useFormSubmit(url: string) {
  const [state, setState] = useState<FormState>("idle");

  async function submit(data: Record<string, unknown>): Promise<boolean> {
    setState("submitting");

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
        setState("error");
        return false;
      }
    } catch (error) {
      console.error(`Failed to submit form to ${url}:`, error);
      setState("error");
      return false;
    }
  }

  return { state, setState, submit };
}
