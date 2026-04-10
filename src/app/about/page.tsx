import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ShopifyCtaButton } from "@/components/ShopifyCtaButton";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About | August Jones",
  description:
    "August Jones is a solo female maker in Madison, WI turning pre-loved sports jerseys into one-of-a-kind streetwear. Meet the maker behind the brand.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-eyebrow mb-6 text-accent/80">The brand</p>
          <h1
            className="text-hero text-foreground"
            style={{
              fontSize: "clamp(4.5rem, 13vw, 12rem)",
              textWrap: "balance",
            }}
          >
            Made by Hand.
            <br />
            <span className="text-foreground/40">Every Single</span>
            <br />
            <span className="text-accent">One.</span>
          </h1>
          <p
            className="text-editorial mt-8 max-w-xl text-foreground/60"
            style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}
          >
            A solo, female-owned brand reworking sports apparel into one-of-one
            pieces, handmade in Madison, Wisconsin.
          </p>
        </div>
      </section>

      {/* ── THE STORY ─────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="story-heading"
        className="relative overflow-hidden bg-background px-6 pb-24 sm:pb-32"
      >
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-px bg-border mb-16" aria-hidden="true" />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            {/* Image */}
            <div className="relative">
              <div className="relative aspect-4/5 overflow-hidden">
                <Image
                  src="/images/Polly.webp"
                  alt="August Jones — handmade upcycled sports fashion crafted in Madison, WI"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Story text */}
            <div className="flex flex-col justify-center gap-8">
              <h2
                id="story-heading"
                className="text-display text-foreground"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
              >
                The Story
              </h2>

              <div className="space-y-5 text-base/relaxed text-foreground/60 sm:text-[17px]">
                <strong className="mb-6 block font-semibold text-accent">
                  August Jones was founded to rethink fan gear.
                </strong>
                <p>
                  With more than 20 years in the apparel industry, designing for
                  global brands across men’s, women’s, and kids, I set out to
                  create something more personal and more considered.
                </p>
                <p>
                  Moving from New York City to Wisconsin, I was reminded what it
                  means to be a fan. The energy around professional and college
                  sports felt familiar, bringing me back to growing up in
                  Western New York, where the connection to the Buffalo Bills
                  runs deep.
                </p>
                <p>
                  Years in the industry also revealed how much is overproduced
                  and discarded. August Jones is rooted in the desire to take
                  what already exists and elevate it through design.
                </p>
                <p>
                  Each piece begins as an existing garment, sourced for its
                  potential, history, or meaning. Through reconstruction and
                  refinement, it is reworked by hand into something entirely
                  new, elevating the original through a focus on fit,
                  proportion, and detail.
                </p>
                <strong className="block font-semibold text-accent">
                  Every piece is one of one.
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT'S MADE ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="process-heading"
        className="relative overflow-hidden bg-background px-6 pb-24 sm:pb-32"
      >
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="h-px bg-border mb-16" aria-hidden="true" />

          <h2
            id="process-heading"
            className="text-display mb-16 text-foreground"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            How It&apos;s Made
          </h2>

          <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Source",
                body: "Every piece begins with existing sports apparel, thrifted, donated, or sourced from professional and collegiate teams.",
              },
              {
                num: "02",
                title: "Reimagine",
                body: "Each garment is deconstructed and redesigned into a new silhouette, cut and reconstructed with a focus on fit, proportion, and wearability.",
              },
              {
                num: "03",
                title: "Finish",
                body: "Every detail is completed by hand. One piece, one label, no duplicates. Once it’s gone, it’s gone.",
              },
            ].map(({ num, title, body }, _i) => (
              <div
                key={num}
                className="flex flex-col gap-4 border-b border-border py-10 sm:border-b-0 sm:border-r sm:px-10 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
              >
                <span
                  className="font-bebas-neue leading-none text-accent"
                  style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}
                  aria-hidden="true"
                >
                  {num}
                </span>
                <h3 className="text-display text-2xl text-foreground">
                  {title}
                </h3>
                <p className="text-sm/relaxed text-foreground/55 sm:text-base">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMISSIONS ───────────────────────────────────────────────────── */}
      <section className="bg-accent px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:items-end">
            <div className="flex flex-col gap-6">
              <p className="text-eyebrow text-[#222]/65">
                Request a custom piece
              </p>
              <h2
                className="text-display text-[#222]"
                style={{
                  fontSize: "clamp(3rem, 7vw, 6rem)",
                  textWrap: "balance",
                }}
              >
                Looking for a custom piece?
              </h2>
              <p className="max-w-xl text-base/relaxed text-[#222]/70 sm:text-lg">
                Custom commissions are open. Send a garment that holds meaning,
                or work with me to source one for you. Each piece is reworked
                into something you will actually wear.
              </p>
            </div>

            <div className="flex items-end">
              <Button
                asChild
                size="lg"
                variant="brand"
                className="h-14 gap-3 px-10 text-base font-medium uppercase tracking-widest"
              >
                <Link href="/contact">
                  <span>Get in Touch</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SHOP CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-[#f6f4f0] px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <p className="text-eyebrow text-[#222]/60">Available now</p>
          <h2
            className="text-display text-[#222]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Shop the Collection
          </h2>
          <p className="max-w-md text-base/relaxed text-[#222]/60 sm:text-lg">
            Browse what&apos;s available now on my shop. Inventory moves fast.
            When a piece is gone, it&apos;s gone for good.
          </p>
          <nav aria-label="Shop navigation" className="w-full max-w-sm">
            <ShopifyCtaButton />
          </nav>
        </div>
      </section>

      <Footer />
    </main>
  );
}
