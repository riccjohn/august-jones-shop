"use client";

import { useId } from "react";
import { HoneypotField } from "@/components/HoneypotField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormSubmit } from "@/hooks/use-form-submit";
import {
  type EmailSignupSource,
  trackEmailSignup,
  trackEmailSignupError,
} from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/constants";

export function EmailSignupForm({
  source,
  className,
  "aria-labelledby": ariaLabelledBy,
}: {
  source: EmailSignupSource;
  className?: string;
  "aria-labelledby"?: string;
}) {
  const { state, setState, submit } = useFormSubmit("/api/subscribe");
  const disabled = state === "submitting";
  const honeypotId = useId();
  const emailId = useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      // Honeypot filled: silently show success without calling the API.
      // The server validates the honeypot anyway, but we don't want to
      // send unnecessary requests if we detect bot behavior on the client.
      setState("success");
      return;
    }

    const email = formData.get("email") as string;

    const succeeded = await submit({ email, source, website: honeypot });
    if (succeeded) {
      trackEmailSignup(source);
    } else {
      trackEmailSignupError(source);
    }
  }

  if (state === "success") {
    return <p className={className}>Thanks for subscribing! You're in.</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      aria-labelledby={ariaLabelledBy}
    >
      <HoneypotField id={honeypotId} />

      <div className="flex items-center gap-2">
        <Label htmlFor={emailId} className="sr-only">
          Email
        </Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={disabled}
        />
        <Button type="submit" variant="brand" disabled={disabled}>
          {state === "submitting" ? "Signing up..." : "Sign Up"}
        </Button>
      </div>

      {state === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong. Try emailing{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline hover:no-underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          directly.
        </p>
      )}
    </form>
  );
}
