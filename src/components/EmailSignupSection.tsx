"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEmailSignup } from "@/lib/analytics";

type SignupState = "idle" | "submitting" | "success" | "error";

export function EmailSignupSection() {
  const [state, setState] = useState<SignupState>("idle");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        trackEmailSignup();
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <section className="bg-foreground px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-bebas-neue text-3xl tracking-wider text-background sm:text-4xl">
          Be First.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-background/70 sm:text-base">
          Join the drop list for early access to new pieces before they hit
          Instagram.
        </p>

        {state === "success" ? (
          <p className="mt-8 font-bebas-neue text-xl tracking-wider text-accent sm:text-2xl">
            You&apos;re on the list.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={state === "submitting"}
              className="h-12 border-background/20 bg-background/10 text-background placeholder:text-background/40 focus-visible:border-background/60 focus-visible:ring-background/20"
              aria-label="Email address"
            />
            <Button
              type="submit"
              size="lg"
              variant="brand-outline"
              disabled={state === "submitting"}
              className="h-12 shrink-0 px-8 text-sm font-medium uppercase tracking-widest"
            >
              {state === "submitting" ? "Joining..." : "Join the List"}
            </Button>
          </form>
        )}

        {state === "error" && (
          <p className="mt-3 text-xs text-background/60">
            Something went wrong. Try again or DM us on Instagram.
          </p>
        )}
      </div>
    </section>
  );
}
