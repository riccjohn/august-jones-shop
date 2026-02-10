import { Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import InstagramIcon from "@/components/InstagramIcon";
import { InstagramLink } from "@/components/InstagramLink";
import { ShopifyCtaButton } from "@/components/ShopifyCtaButton";
import { Button } from "@/components/ui/button";

const productImages = [
  {
    id: 1,
    title: "Upcycled Streetwear",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "August Jones upcycled streetwear piece",
  },
  {
    id: 2,
    title: "Hand-Made Fashion",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "August Jones hand-made fashion item",
  },
  {
    id: 3,
    title: "Renewed Jersey Design",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "August Jones renewed jersey design",
  },
  {
    id: 4,
    title: "One-of-a-Kind Creation",
    src: "/images/product/pablo-lara-i1JJP5S6skw-unsplash.jpg",
    alt: "August Jones one-of-a-kind creation",
  },
] as const;

const TITLE = 'Upcycled Fashion for Every Fan'
const DESCRIPTION = 'Reimagined from pre-loved sports apparel into elevated, one-of-a-kind statements. Each piece embodies creative reinvention and a more sustainable approach to fan fashion.'
const ABOUT = 'August Jones transforms vintage sportswear into one-of-a-kind pieces designed for game day and beyond. Handmade in Wisconsin from upcycled materials, each design is as original as the fans who wear it.'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero Section - Full viewport impact with eggshell background */}
      <section className="flex min-h-[85vh] flex-col items-center justify-center bg-background px-6 py-20 sm:py-28">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center lg:max-w-3xl lg:gap-10">
          {/* Brand Logo - Larger with black border */}
          <header className="flex flex-col items-center">
            <h1>
              <div className="border-6 border-foreground">
                <Image
                  src="/logos/August_Jones_Logo.svg"
                  alt="August Jones - Renewed Fashion"
                  width={500}
                  height={500}
                  priority
                  className="h-auto w-48 bg-background sm:w-64 lg:w-72"
                />
              </div>
            </h1>
          </header>

          {/* Hero Headline - Bold typography with Bebas Neue */}
          <div className="space-y-4">
            <h2 className="font-bebas-neue text-4xl tracking-wider text-foreground sm:text-5xl lg:text-6xl">
              {TITLE}
            </h2>
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
        <div className="mx-auto w-full max-w-6xl">
          <h2
            id="products-heading"
            className="mb-12 text-center font-bebas-neue text-3xl tracking-wider text-foreground sm:mb-16 sm:text-4xl"
          >
            Past Work
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 lg:gap-8">
            {productImages.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col gap-2 sm:gap-3"
              >
                <h3 className="font-bebas-neue text-lg tracking-wider text-foreground sm:text-xl">
                  {product.title}
                </h3>
                <div className="relative aspect-3/4 overflow-hidden rounded-sm">
                  <Image
                    src={product.src}
                    alt={product.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
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
    <footer className="bg-foreground px-6 py-16 text-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <div className="text-center">
          <h2 className="font-bebas-neue text-2xl tracking-wider sm:text-3xl">
            Get in Touch
          </h2>
        </div>

        <div className="flex flex-col gap-4 items-center sm:flex-row sm:justify-center sm:gap-8">
          <InstagramLink
            location="footer"
            aria-label="August Jones on Instagram"
            className="group flex items-center gap-2 rounded-md px-2 py-1"
          >
            <InstagramIcon className="h-5 w-5 shrink-0 opacity-80" />
            <span className="text-background/90 transition-colors duration-200 group-hover:text-[#ffb612] group-hover:underline group-hover:underline-offset-2">
              @augustjonesshop
            </span>
          </InstagramLink>
          <Link
            href="mailto:hello@augustjones.shop"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-md px-2 py-1"
          >
            <Mail className="h-5 w-5 shrink-0 opacity-80" aria-hidden="true" />
            <span className="text-background/90 transition-colors duration-200 group-hover:text-[#ffb612] group-hover:underline group-hover:underline-offset-2">
              hello@augustjones.shop
            </span>
          </Link>
        </div>

        <div className="text-center text-sm text-background/70">
          <p>&copy; 2026 August Jones. All rights reserved.</p>
          <p>
            Made with <span className="text-[#ffb612]">❤️</span> in Madison, WI
          </p>
        </div>
      </div>
    </footer>
  );
};
