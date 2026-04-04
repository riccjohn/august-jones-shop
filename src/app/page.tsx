import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import InstagramIcon from "@/components/InstagramIcon";
import { InstagramLink } from "@/components/InstagramLink";
import { ProductGalleryLink } from "@/components/ProductGalleryLink";
import { ProductGallerySchema } from "@/components/ProductGallerySchema";
import { ShopifyCtaButton } from "@/components/ShopifyCtaButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "August Jones | Upcycled Sports Fashion from Wisconsin",
    description:
      "Hand-made, one-of-a-kind upcycled sports fashion. Streetwear vests, hoodies, sweatpants, and jackets created from upcycled sports wear by a solo female-owned brand in Madison, WI.",
    alternates: {
      canonical: "/",
    },
  };
}

const ETSY_SHOP_URL = "https://www.etsy.com/shop/TheAugustJonesShop";

const productImages = [
  {
    id: 1,
    title: "Hoodies",
    src: "/images/product/hoodies.webp",
    alt: "One-of-a-kind Green Bay Packers hoodie made from upcycled fan gear",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_reworked`,
    category: "hoodies",
  },
  {
    id: 2,
    title: "Jackets",
    src: "/images/product/jackets.webp",
    alt: "Unique game day outfit made from upcycled sports jerseys and thrifted military jacket",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_gameday`,
    category: "jackets",
  },
  {
    id: 3,
    title: "Vests",
    src: "/images/product/vests.webp",
    alt: "Hand-made upcycled sports jersey puffer vest by August Jones",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_hoodie`,
    category: "vests",
  },
  {
    id: 4,
    title: "Sweatpants",
    src: "/images/product/sweatpants.webp",
    alt: "One-of-a-kind Milwaukee Bucks sweatpants made from upcycled fan gear",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_gameday`,
    category: "sweatpants",
  },
  {
    id: 5,
    title: "T-Shirts",
    src: "/images/product/tshirts.webp",
    alt: "Custom cropped Milwaukee Brewers t-shirt made from upcycled fan gear",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_streetwear`,
    category: "tshirts",
  },
  {
    id: 6,
    title: "Accessories",
    src: "/images/product/accessories_04.webp",
    alt: "Hand-made Green Bay Packers and Denver Broncos fanny packs made from upcycled NFL jerseys",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_gameday`,
    category: "accessories",
  },
] as const;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background">
        <GrainOverlay />

        {/* Subtle radial depth — not a flat void */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 50%, oklch(0.14 0.008 264 / 0.6), transparent)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-56px)] max-w-7xl grid-cols-1 items-center gap-0 px-6 pb-16 pt-12 sm:px-8 lg:grid-cols-[3fr_2fr] lg:gap-16 lg:pb-0 lg:pt-0">
          {/* LEFT — text content */}
          <div className="flex flex-col gap-8 lg:py-24">
            {/* Provenance label */}
            <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-accent/70">
              Madison, WI — Handmade since 2024
            </p>

            {/* Hero heading — Bebas Neue at heroic scale */}
            <h1
              className="font-bebas-neue leading-[0.88] tracking-[-0.01em] text-foreground"
              style={{
                fontSize: "clamp(5.5rem, 14vw, 13rem)",
                textWrap: "balance",
              }}
            >
              Upcycled
              <br />
              For The
              <br />
              <span className="text-accent">Fans.</span>
            </h1>

            {/* Editorial subhead — Instrument Serif italic */}
            <p
              className="font-instrument-serif italic max-w-md leading-relaxed text-foreground/60"
              style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)" }}
            >
              One-of-a-kind pieces built from the jerseys you love — and the
              teams you&apos;ll never give up on.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <ShopifyCtaButton />
            </div>
          </div>

          {/* RIGHT — hero product image */}
          <div className="relative hidden lg:block">
            {/* Yellow accent line */}
            <div
              className="absolute -left-4 top-[15%] h-[60%] w-px bg-accent/30"
              aria-hidden="true"
            />

            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src="/images/product/jackets.webp"
                alt="Hand-made upcycled game day outfit by August Jones"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1280px) 40vw, 500px"
                className="object-cover"
              />
              {/* ONE OF ONE badge */}
              <div
                className="absolute right-4 top-8 bg-accent px-3 py-1.5"
                style={{ transform: "rotate(2deg)" }}
                aria-hidden="true"
              >
                <span className="font-bebas-neue text-sm tracking-[0.2em] text-[#222]">
                  One of One
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COLLECTION ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="collection-heading"
        className="bg-[#f6f4f0] px-6 py-20 sm:py-28"
      >
        <ProductGallerySchema products={productImages} />
        <div className="mx-auto w-full max-w-6xl">
          {/* Section header */}
          <div className="mb-12 flex items-end justify-between gap-6 sm:mb-16">
            <h2
              id="collection-heading"
              className="font-bebas-neue text-[#222] leading-none tracking-wider"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
            >
              The Collection
            </h2>
            <a
              href={`${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=collection_header`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 font-geist-mono text-[10px] uppercase tracking-[0.2em] text-[#222]/60 underline underline-offset-4 hover:text-[#ffb612] hover:no-underline sm:block"
            >
              View all on Etsy ↗
            </a>
          </div>

          {/* Editorial 2-col grid */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-16">
            {productImages.map((product, i) => (
              <ProductGalleryLink
                key={product.id}
                product={product}
                index={i}
              />
            ))}
          </div>

          {/* Mobile "view all" link */}
          <div className="mt-10 flex justify-center sm:hidden">
            <a
              href={`${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=collection_footer`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-[#222]/60 underline underline-offset-4 hover:text-[#ffb612] hover:no-underline"
            >
              View all on Etsy ↗
            </a>
          </div>
        </div>
      </section>

      {/* ── BRAND STATEMENT ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32">
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Pull quote */}
          <blockquote
            className="font-instrument-serif italic leading-[1.2] text-foreground/80"
            style={{
              fontSize: "clamp(1.75rem, 4.5vw, 3.5rem)",
              textWrap: "balance",
            }}
          >
            &ldquo;Every piece starts with a jersey that has a history — and a
            team you still believe in.&rdquo;
          </blockquote>

          {/* Attribution */}
          <p className="mt-6 font-geist-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">
            — August Jones, maker
          </p>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-3 gap-0 border-t border-border pt-10 sm:mt-20">
            {[
              { value: "100+", label: "Pieces Made" },
              { value: "1", label: "Maker" },
              { value: "0", label: "Duplicates" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col gap-2 border-r border-border px-6 last:border-r-0 first:pl-0 last:pr-0 sm:px-10"
              >
                <span
                  className="font-bebas-neue leading-none text-accent"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
                >
                  {value}
                </span>
                <span className="font-geist-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background px-6 pb-24 pt-0 sm:pb-32">
        <GrainOverlay />
        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Full-width divider line */}
          <div className="mb-16 h-px bg-border" aria-hidden="true" />

          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4">
              <p className="font-geist-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                Follow the drops
              </p>
              <h2
                className="font-bebas-neue leading-none tracking-wide text-foreground"
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
              >
                @augustjonesshop
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-foreground/70">
                New drops posted on Instagram first. Follow along to see what's
                being made — and grab a piece before it's gone.
              </p>
            </div>

            <InstagramLink
              location="hero"
              className={cn(
                buttonVariants({ variant: "ghost-outline" }),
                "group h-auto shrink-0 gap-3 px-6 py-3.5",
              )}
            >
              <InstagramIcon className="h-4 w-4 text-accent transition-colors duration-300 group-hover:text-[#222]" />
              <span className="font-bebas-neue text-lg tracking-[0.15em] text-accent transition-colors duration-300 group-hover:text-[#222]">
                Follow on Instagram
              </span>
            </InstagramLink>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
