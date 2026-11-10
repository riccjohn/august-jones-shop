import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import { TermsAndConditions } from "@/components/TermsAndConditions";
import { CUSTOMS_OPEN } from "@/lib/config";
import { CONTACT_EMAIL } from "@/lib/constants";
import { CUSTOM_PIECES, formatPriceRange } from "@/lib/custom-pieces";

const DESCRIPTION =
  "Commission a one-of-a-kind jacket, vest, flannel, or fanny pack made from your old jerseys and fan gear — or let me source them. Hand-made in Madison, WI.";

export const metadata: Metadata = {
  title: "Custom Upcycled Jersey Jackets, Vests & More | August Jones",
  description: DESCRIPTION,
  alternates: {
    canonical: "/customs",
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Custom Upcycled Sports Apparel",
  serviceType: "Custom clothing commission",
  description: DESCRIPTION,
  url: "https://www.augustjones.shop/customs/",
  provider: { "@id": "https://www.augustjones.shop/#localbusiness" },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Custom pieces",
    itemListElement: CUSTOM_PIECES.map((piece) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: `Custom ${piece.name}` },
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        minPrice: piece.minPrice,
        maxPrice: piece.maxPrice,
      },
    })),
  },
};

const FACTS = [
  { value: "4–8 Wks", label: "Turnaround" },
  { value: "50%", label: "Deposit to start" },
  { value: "Yours", label: "Or I source the gear" },
  { value: "Shipped", label: "Straight to your door" },
] as const;

export default function CustomsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema)}
      </script>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <GrainOverlay />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
          <div className="flex flex-col gap-8">
            <p className="text-eyebrow text-accent/80">
              Custom commissions — Madison, WI
            </p>
            <h1
              className="text-hero text-foreground"
              style={{
                fontSize: "clamp(4rem, 10vw, 9rem)",
                textWrap: "balance",
              }}
            >
              Custom Team Gear
            </h1>
            <p
              className="text-editorial max-w-lg text-foreground/60"
              style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}
            >
              Send me the jersey from your closet, or let me hunt one down.
              I&apos;ll rework it by hand into a one-of-a-kind piece built
              around your team.
            </p>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative aspect-3/4 overflow-hidden">
              <Image
                src="/images/product/jackets_02.webp"
                alt="Custom cropped camo military jacket with a Green Bay Packers patch, hand-made by August Jones"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1280px) 40vw, 460px"
                className="object-cover"
              />
            </div>
          </div>
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
                  Looking for a custom piece?{" "}
                  <a
                    href="#request"
                    className="text-foreground/55 underline underline-offset-2 hover:text-accent transition-colors duration-200"
                  >
                    Send a request
                  </a>{" "}
                  and I'll get back to you within 2 - 3 days.
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

      {/* ── WHAT I MAKE ───────────────────────────────────────────────────── */}
      <section
        aria-labelledby="pieces-heading"
        className="relative overflow-hidden bg-background px-6 py-16 sm:py-24"
      >
        <GrainOverlay />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2
              id="pieces-heading"
              className="text-display text-foreground"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              What I Make
            </h2>
            <p className="max-w-lg text-sm/relaxed text-foreground/70 sm:text-base">
              Every custom August Jones piece starts with real team apparel —
              old jerseys, hoodies, tees, and fan gear from whoever you root
              for. Each one is taken apart and rebuilt into something
              you&apos;ll actually wear, on game day and after. No templates, no
              duplicates: one piece, made for you in my Madison, WI studio and
              shipped to your door.
            </p>
            <p className="max-w-lg text-sm/relaxed text-foreground/70 sm:text-base">
              Have something else in mind? Choose &ldquo;Other&rdquo; on the
              form and tell me about it.
            </p>
          </div>

          <ul
            aria-labelledby="pieces-heading"
            className="flex flex-col border-t border-border"
          >
            {CUSTOM_PIECES.map((piece) => (
              <li
                key={piece.value}
                className="flex items-baseline justify-between gap-6 border-b border-border py-5"
              >
                <span className="text-display text-2xl text-foreground sm:text-3xl">
                  {piece.name}
                </span>
                <span className="font-bebas-neue shrink-0 text-xl tracking-wide text-accent sm:text-2xl">
                  {formatPriceRange(piece)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fact strip */}
        <div className="relative z-10 mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-y-10 border-t border-border pt-10 sm:mt-20 sm:grid-cols-4">
          {FACTS.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col gap-2 pr-6 sm:border-r sm:border-border sm:px-8 sm:first:pl-0 sm:last:border-r-0"
            >
              <span
                className="font-bebas-neue leading-none text-accent"
                style={{ fontSize: "clamp(2.25rem, 4vw, 3.5rem)" }}
              >
                {value}
              </span>
              <span className="text-eyebrow text-foreground/65">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────────────────────── */}
      {CUSTOMS_OPEN && (
        <section
          id="request"
          aria-label="Custom request form"
          className="relative scroll-mt-24 overflow-hidden bg-background px-6 py-16 sm:py-24"
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
