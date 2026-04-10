import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";

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
          <p
            className="text-editorial mt-6 max-w-lg text-foreground/60"
            style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)" }}
          >
            Questions about a piece, an order, or a custom commission — I read
            every message personally and respond within 2–3 days.
          </p>
        </div>
      </section>

      {/* ── COMMISSION CALLOUT ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="border-l-2 border-accent bg-accent/5 py-6 pl-6 pr-6 sm:py-8 sm:pl-8">
            <h2 className="text-display text-2xl text-foreground sm:text-3xl">
              Custom Commissions Are Open
            </h2>
            <p className="mt-2 max-w-xl text-sm/relaxed text-foreground/55 sm:text-base">
              Have a jersey collecting dust — a childhood favorite, a traded
              player, a piece of your team&apos;s history? Send it and I&apos;ll
              transform it into something you&apos;ll actually wear. Select
              &ldquo;Custom Commission&rdquo; below to get started.
            </p>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ──────────────────────────────────────────────────── */}
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
            Send a Message
          </h2>
          <ContactForm />
          <p className="mt-8 text-sm text-foreground/60">
            Prefer email?{" "}
            <a
              href="mailto:hello@augustjones.shop"
              className="text-foreground/60 underline underline-offset-4 hover:text-accent hover:no-underline transition-colors duration-200"
            >
              hello@augustjones.shop
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
