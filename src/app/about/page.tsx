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
            A solo, female-owned brand turning pre-loved sports jerseys into
            one-of-a-kind streetwear — handmade in Madison, WI.
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
              <div className="relative aspect-[4/5] overflow-hidden">
                {/* Replace with actual maker/process photo */}
                <Image
                  src="/images/product/pablo-lara-i1JJP5S6skw-unsplash.webp"
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

              <div className="space-y-5 text-base leading-relaxed text-foreground/60 sm:text-[17px]">
                <p>
                  August Jones started with a simple question: why do perfectly
                  good jerseys end up in a drawer, forgotten after a trade or a
                  tough season? A fan&apos;s relationship with their team
                  doesn&apos;t end just because a player moves on — and neither
                  should the gear.
                </p>
                <p>
                  Every piece starts with a jersey that has a history. It gets
                  taken apart, reimagined, and rebuilt into something
                  you&apos;ll actually reach for — a hoodie, a vest, a jacket, a
                  pair of sweatpants — with the spirit of the original still in
                  every seam.
                </p>
                <p>
                  No two pieces are the same. Each one is cut and constructed by
                  hand, from sourcing through finishing, right here in
                  Wisconsin. If it has an August Jones label, it&apos;s one of a
                  kind — and so is the person who wears it.
                </p>
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
                body: "Every piece starts with a real jersey — thrifted, donated, or found — from pro teams, college programs, and fan gear across every league.",
              },
              {
                num: "02",
                title: "Reimagine",
                body: "The jersey gets deconstructed and rebuilt into a new silhouette — cut, pieced, and constructed to wear like streetwear, not a game-day uniform.",
              },
              {
                num: "03",
                title: "Finish",
                body: "Every detail is finished by hand. One piece, one label, no duplicates. When it's gone, it's gone.",
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
                <p className="text-sm leading-relaxed text-foreground/55 sm:text-base">
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
              <p className="text-eyebrow text-[#222]/65">Custom Work</p>
              <h2
                className="text-display text-[#222]"
                style={{
                  fontSize: "clamp(3rem, 7vw, 6rem)",
                  textWrap: "balance",
                }}
              >
                Have a Jersey with a Story?
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-[#222]/70 sm:text-lg">
                Custom commissions are open. Send your jersey — a childhood
                favorite, a player you still believe in, a piece of your
                team&apos;s history — and it&apos;ll come back as something
                you&apos;ll actually wear every day.
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
          <p className="max-w-md text-base leading-relaxed text-[#222]/60 sm:text-lg">
            Browse what&apos;s available now on Etsy. Inventory moves fast —
            when a piece is gone, it&apos;s gone for good.
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
