import { Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FooterShopLink } from "@/components/FooterShopLink";
import InstagramIcon from "@/components/InstagramIcon";
import { InstagramLink } from "@/components/InstagramLink";
import { ProductGalleryLink } from "@/components/ProductGalleryLink";
import { ProductGallerySchema } from "@/components/ProductGallerySchema";
import { ShopifyCtaButton } from "@/components/ShopifyCtaButton";
import { Button } from "@/components/ui/button";

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
    title: "Upcycled Sports Jersey Hoodie",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "Hand-made upcycled sports jersey hoodie by August Jones",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_hoodie`,
    category: "hoodies",
  },
  {
    id: 2,
    title: "Hand-Made Jersey Streetwear",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "Hand-made streetwear created from pre-loved sports jerseys",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_streetwear`,
    category: "streetwear",
  },
  {
    id: 3,
    title: "Reworked NFL Jersey Design",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "Upcycled NFL jersey transformed into a one-of-a-kind fashion piece",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_reworked`,
    category: "reworked",
  },
  {
    id: 4,
    title: "One-of-a-Kind Game Day Look",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "Unique game day outfit made from upcycled sports jerseys",
    href: `${ETSY_SHOP_URL}?utm_source=augustjones&utm_medium=website&utm_campaign=gallery_gameday`,
    category: "gameday",
  },
] as const;

const TITLE = "Upcycled Fashion for Every Fan";
const DESCRIPTION =
  "Reimagined from pre-loved sports apparel into elevated, one-of-a-kind statements. Each piece embodies creative reinvention and a more sustainable approach to fan fashion.";
const ABOUT =
  "August Jones transforms vintage sportswear into one-of-a-kind pieces designed for game day and beyond. Handmade in Wisconsin from upcycled materials, each design is as original as the fans who wear it.";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section - Full viewport impact with eggshell background */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center bg-background px-6 py-20 sm:py-28">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center lg:max-w-3xl lg:gap-10">
          {/* Brand Logo and Primary Heading */}
          <header className="flex flex-col items-center gap-6">
            <div className="border-6 border-foreground" aria-hidden="true">
              <Image
                src="/logos/August_Jones_Logo.svg"
                alt=""
                width={500}
                height={500}
                priority
                className="h-auto w-48 bg-background sm:w-64 lg:w-72"
              />
            </div>
            <h1 className="font-bebas-neue text-4xl tracking-wider text-foreground sm:text-5xl lg:text-6xl">
              {TITLE}
            </h1>
          </header>

          {/* Hero Description */}
          <div className="space-y-4">
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {DESCRIPTION}
            </p>
          </div>

          {/* Primary CTA - Enhanced presence */}
          <nav aria-label="Primary navigation" className="w-full max-w-sm">
            <ShopifyCtaButton />
          </nav>
        </div>
      </section>

      {/* Brand Story Section - White background for elevation */}
      <section
        aria-labelledby="about-heading"
        className="bg-white px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="about-heading"
            className="font-bebas-neue text-3xl tracking-wider text-foreground sm:text-4xl"
          >
            Renewed Fashion
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {ABOUT}
          </p>
        </div>
      </section>

      {/* Instagram Callout Section - Charcoal background */}
      <section className="bg-foreground px-6 py-12 sm:py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <p className="font-bebas-neue text-xl tracking-wider text-background sm:text-2xl">
            Follow the Journey
          </p>
          <Button
            asChild
            size="lg"
            variant="brand-outline"
            className="h-12 w-full max-w-sm gap-3 px-8 text-base font-medium uppercase tracking-widest sm:h-14"
          >
            <InstagramLink location="hero">
              <InstagramIcon className="h-5 w-5" />
              <span>@augustjonesshop</span>
            </InstagramLink>
          </Button>
        </div>
      </section>

      {/* Product Gallery Section - Eggshell background with enhanced grid */}
      <section
        aria-labelledby="products-heading"
        className="bg-background px-6 py-20 sm:py-28"
      >
        <ProductGallerySchema products={productImages} />
        <div className="mx-auto w-full max-w-6xl">
          <h2
            id="products-heading"
            className="mb-12 text-center font-bebas-neue text-3xl tracking-wider text-foreground sm:mb-16 sm:text-4xl"
          >
            Past Work
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 lg:gap-8">
            {productImages.map((product) => (
              <ProductGalleryLink key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
      {/* Footer Section - Charcoal background with utility contact */}
      <Footer />
    </main>
  );
}

const Footer = () => {
  return (
    <footer className="bg-foreground px-6 py-10 text-background sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Main footer content: two groups side by side on desktop */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
          {/* Navigate group */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <p className="text-xs font-medium uppercase tracking-widest text-background/50">
              Navigate
            </p>
            <nav
              aria-label="Footer navigation"
              className="flex flex-col items-center gap-2 sm:items-start"
            >
              <FooterShopLink />
            </nav>
          </div>

          {/* Connect group */}
          <div className="flex flex-col items-center gap-3 sm:items-end">
            <p className="text-xs font-medium uppercase tracking-widest text-background/50">
              Connect
            </p>
            <div className="flex flex-col items-center gap-2 sm:items-end">
              <InstagramLink
                location="footer"
                aria-label="August Jones on Instagram"
                className="group flex items-center gap-2"
              >
                <InstagramIcon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="text-sm text-background/90 transition-colors duration-200 group-hover:text-[#ffb612]">
                  @augustjonesshop
                </span>
              </InstagramLink>
              <Link
                href="mailto:hello@augustjones.shop"
                className="group flex items-center gap-2"
              >
                <Mail
                  className="h-4 w-4 shrink-0 opacity-80"
                  aria-hidden="true"
                />
                <span className="text-sm text-background/90 transition-colors duration-200 group-hover:text-[#ffb612]">
                  hello@augustjones.shop
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-background/10" />

        {/* Copyright row */}
        <div className="flex flex-col items-center gap-1 text-center text-xs text-background/60 sm:flex-row sm:justify-between">
          <p>&copy; 2026 August Jones. All rights reserved.</p>
          <p>
            Made with <span className="text-[#ffb612]">❤️</span> in Madison, WI
          </p>
        </div>
      </div>
    </footer>
  );
};
