import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import { TermsAndConditions } from "@/components/TermsAndConditions";
import { CUSTOMS_OPEN } from "@/lib/config";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact | August Jones",
  description:
    "Questions about a piece, interested in a custom commission? Get in touch with August Jones.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-eyebrow mb-6 text-accent/80">Say hello</p>
          <h1
            className="text-hero text-foreground"
            style={{ fontSize: "clamp(4rem, 12vw, 11rem)" }}
          >
            Get in Touch
          </h1>
        </div>
      </section>

      {/* ── COMMISSION CALLOUT ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-l-2 border-accent bg-accent/5 py-6 pl-6 pr-6 sm:py-8 sm:pl-8">
            <h2 className="text-display text-2xl text-foreground sm:text-3xl">
              {CUSTOMS_OPEN
                ? "Custom Commissions Are Open"
                : "Custom Commissions Are Closed"}
            </h2>
            <p className="mt-2 max-w-xl text-sm/relaxed text-foreground/55 sm:text-base">
              {CUSTOMS_OPEN ? (
                <>
                  Looking for a custom piece? Send a message and I'll get back
                  to you within 2 - 3 days.
                </>
              ) : (
                <>
                  I'm temporarily closed for custom commissions while I focus on
                  existing orders. Join my{" "}
                  <Link
                    href="/join"
                    className="text-foreground/55 underline underline-offset-2 hover:text-accent transition-colors duration-200"
                  >
                    email list
                  </Link>{" "}
                  to get notified when they reopen.
                </>
              )}
            </p>
            {!CUSTOMS_OPEN && (
              <p className="mt-4 max-w-xl text-sm text-foreground/55">
                Prefer email or have other questions? Email{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-foreground/55 underline underline-offset-2 hover:text-accent transition-colors duration-200"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────────────────────── */}
      {CUSTOMS_OPEN && (
        <section
          aria-label="Contact form"
          className="relative overflow-hidden bg-background px-6 py-16 sm:py-24"
        >
          <GrainOverlay />
          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="h-px bg-border mb-12" aria-hidden="true" />
            <ContactForm />
            <p className="mt-8 text-sm text-foreground/60">
              Prefer email or have other questions? Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-foreground/60 underline underline-offset-4 hover:text-accent hover:no-underline transition-colors duration-200"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      )}

      {/* ── TERMS & CONDITIONS ──────────────────────────────────────────── */}
      <TermsAndConditions />

      <Footer />
    </main>
  );
}
