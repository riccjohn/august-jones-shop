import { Instagram, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center sm:max-w-md sm:gap-10 lg:max-w-lg">
        {/* Brand Header */}
        <header className="flex flex-col items-center gap-3">
          <h1 className="font-bebas-neue text-6xl uppercase tracking-wide text-foreground sm:text-7xl lg:text-8xl">
            August Jones
          </h1>
          <p className="font-sans text-lg font-light tracking-wide text-muted-foreground sm:text-xl lg:text-2xl">
            Renewed Fashion
          </p>
        </header>

        {/* Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="flex w-full flex-col gap-4"
        >
          {/* Primary CTA - Shop Now */}
          <Button
            asChild
            size="lg"
            className="h-14 w-full text-lg font-medium sm:h-16"
          >
            <Link
              href="https://www.etsy.com/shop/TheAugustJonesShop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shop Now
            </Link>
          </Button>

          {/* Instagram Link */}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 w-full gap-3 text-base font-medium hover:bg-accent/10 sm:h-16"
          >
            <Link
              href="https://instagram.com/augustjonesshop"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
              <span>@augustjonesshop</span>
            </Link>
          </Button>

          {/* Email Link */}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 w-full gap-3 text-base font-medium hover:bg-accent/10 sm:h-16"
          >
            <Link
              href="mailto:hello@augustjones.shop"
              rel="noopener noreferrer"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              <span>hello@augustjones.shop</span>
            </Link>
          </Button>
        </nav>
      </div>
    </main>
  );
}
