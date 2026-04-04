import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ShopifyCtaButton } from "@/components/ShopifyCtaButton";

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
      {/* Hero Section */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-foreground px-6 py-20 sm:py-28">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="font-bebas-neue text-5xl tracking-wider text-background sm:text-6xl lg:text-7xl">
            Made by Hand.
            <br />
            Every Single One.
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-background/75 sm:text-lg">
            August Jones is a solo, female-owned brand turning pre-loved sports
            jerseys into one-of-a-kind streetwear — handmade in Madison, WI.
          </p>
        </div>
      </section>

      {/* The Story Section */}
      <section
        aria-labelledby="story-heading"
        className="bg-background px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="story-heading"
            className="font-bebas-neue text-3xl tracking-wider text-foreground sm:text-4xl"
          >
            The Story
          </h2>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              August Jones started with a simple question: why do perfectly good
              jerseys end up in a drawer, forgotten after a trade or a tough
              season? A fan&apos;s relationship with their team doesn&apos;t end
              just because a player moves on — and neither should the gear.
            </p>
            <p>
              Every piece starts with a jersey that has a history. It gets taken
              apart, reimagined, and rebuilt into something you&apos;ll actually
              reach for — a hoodie, a vest, a jacket, a pair of sweatpants —
              with the spirit of the original still in every seam.
            </p>
            <p>
              No two pieces are the same. Each one is cut and constructed by
              hand, from sourcing through finishing, right here in Wisconsin. If
              it has an August Jones label, it&apos;s one of a kind — and so is
              the person who wears it.
            </p>
          </div>
        </div>
      </section>

      {/* The Process Section */}
      <section
        aria-labelledby="process-heading"
        className="bg-white px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="process-heading"
            className="font-bebas-neue text-3xl tracking-wider text-foreground sm:text-4xl"
          >
            How It&apos;s Made
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="font-bebas-neue text-5xl text-accent">01</span>
              <h3 className="font-bebas-neue text-xl tracking-wider text-foreground">
                Source
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Every piece starts with a real jersey — thrifted, donated, or
                found — from pro teams, college programs, and fan gear across
                every league.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-bebas-neue text-5xl text-accent">02</span>
              <h3 className="font-bebas-neue text-xl tracking-wider text-foreground">
                Reimagine
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                The jersey gets deconstructed and rebuilt into a new silhouette
                — cut, pieced, and constructed to wear like streetwear, not a
                game-day uniform.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-bebas-neue text-5xl text-accent">03</span>
              <h3 className="font-bebas-neue text-xl tracking-wider text-foreground">
                Finish
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Every detail is finished by hand. One piece, one label, no
                duplicates. When it&apos;s gone, it&apos;s gone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Commissions Section */}
      <section className="bg-foreground px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-bebas-neue text-3xl tracking-wider text-background sm:text-4xl">
            Have a Jersey with a Story?
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-background/75 sm:text-lg">
            Custom commissions are open. Send your jersey — a childhood
            favorite, a player you still believe in, a piece of your team&apos;s
            history — and it&apos;ll come back as something you&apos;ll actually
            wear every day.
          </p>
        </div>
      </section>

      {/* Shop CTA Section */}
      <section className="bg-background px-6 py-20 sm:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="font-bebas-neue text-3xl tracking-wider text-foreground sm:text-4xl">
            Shop the Collection
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
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
