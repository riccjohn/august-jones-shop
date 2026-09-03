import type { Metadata } from "next";
import { EmailSignupForm } from "@/components/EmailSignupForm";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import { EMAIL_SIGNUP_ENABLED } from "@/lib/config";
import { CONTACT_EMAIL } from "@/lib/constants";

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
          <p className="text-eyebrow mb-6 text-accent/80">
            Before it&rsquo;s in the shop
          </p>
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
              Get the First Look
            </h2>
            <p className="mt-2 max-w-xl text-sm/relaxed text-foreground/55 sm:text-base">
              Every piece is one-of-one. Once it&rsquo;s gone, it&rsquo;s gone.
              Get first access to new drops before they&rsquo;re posted
              publicly, plus market and event dates so you can shop in person
              too.
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
          {EMAIL_SIGNUP_ENABLED ? (
            <EmailSignupForm source="join" aria-labelledby="form-heading" />
          ) : (
            <p className="text-sm/relaxed text-foreground/55">
              Sign-ups are temporarily paused. Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline underline-offset-4 hover:text-accent transition-colors duration-200"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              to get on the list in the meantime.
            </p>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
