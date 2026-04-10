"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: "custom-commission",
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-sm bg-accent/10 border border-accent/30 px-6 py-10 text-center">
        <p className="font-bebas-neue text-2xl tracking-wider text-foreground sm:text-3xl">
          Request Received
        </p>
        <p className="mt-3 text-sm/relaxed text-muted-foreground sm:text-base">
          Thanks for reaching out. I typically respond within 2–3 days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            required
            disabled={state === "submitting"}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={state === "submitting"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Tell me about your jersey</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="What team, what era, what do you have in mind? The more detail the better."
          rows={6}
          required
          disabled={state === "submitting"}
        />
      </div>

      {state === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong. Try emailing{" "}
          <a
            href="mailto:customs@augustjones.shop"
            className="underline hover:no-underline"
          >
            customs@augustjones.shop
          </a>{" "}
          directly.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        variant="brand"
        disabled={state === "submitting"}
        className="h-14 w-full text-base font-medium uppercase tracking-widest sm:w-auto sm:px-12"
      >
        {state === "submitting" ? "Sending..." : "Request a Custom"}
      </Button>
    </form>
  );
}
