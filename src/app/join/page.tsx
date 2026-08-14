import type { Metadata } from "next";
import { EmailSignupForm } from "@/components/EmailSignupForm";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";

export const metadata: Metadata = {
  title: "Join the List | August Jones",
  description:
    "Sign up for early access to new drops and announcements about upcoming markets and events.",
  alternates: {
    canonical: "/join",
  },
};

export default function JoinPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-eyebrow mb-6 text-accent/80">Stay in the loop</p>
          <h1
            className="text-hero text-foreground"
            style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
          >
            Join the List
          </h1>
        </div>
      </section>

      {/* ── VALUE PROP ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-l-2 border-accent bg-accent/5 py-6 pl-6 pr-6 sm:py-8 sm:pl-8">
            <h2 className="text-display text-2xl text-foreground sm:text-3xl">
              Be First to Know
            </h2>
            <p className="mt-2 max-w-xl text-sm/relaxed text-foreground/55 sm:text-base">
              Get early access to new one-of-a-kind drops before they go live,
              plus announcements about upcoming markets and events where you can
              shop in person.
            </p>
          </div>
        </div>
      </section>

      {/* ── SIGNUP FORM ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="form-heading"
        className="relative overflow-hidden bg-background px-6 py-16 sm:py-24"
      >
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="h-px bg-border mb-12" aria-hidden="true" />
          <h2
            id="form-heading"
            className="text-display mb-10 text-foreground"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Sign Up
          </h2>
          <EmailSignupForm source="join" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
