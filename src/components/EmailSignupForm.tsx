"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEmailSignup } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/constants";

type FormState = "idle" | "submitting" | "success" | "error";

export function EmailSignupForm({
  source,
  className,
}: {
  source: "footer" | "join";
  className?: string;
}) {
  const [state, setState] = useState<FormState>("idle");
  const disabled = state === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      setState("success");
      return;
    }

    setState("submitting");

    const email = formData.get("email") as string;

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, source }),
      });

      if (res.ok) {
        setState("success");
        trackEmailSignup(source);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return <p className={className}>Thanks for subscribing! You're in.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] overflow-hidden"
      >
        <label htmlFor={`website-${source}`}>Website</label>
        <input
          id={`website-${source}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor={`email-${source}`} className="sr-only">
          Email
        </Label>
        <Input
          id={`email-${source}`}
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
