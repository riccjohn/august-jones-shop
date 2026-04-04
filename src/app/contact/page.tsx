import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";

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
      {/* Hero Section */}
      <section className="flex min-h-[45vh] flex-col items-center justify-center bg-foreground px-6 py-20 sm:py-28">
        <div className="flex w-full max-w-3xl flex-col items-center gap-4 text-center">
          <h1 className="font-bebas-neue text-5xl tracking-wider text-background sm:text-6xl lg:text-7xl">
            Get in Touch
          </h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-background/75 sm:text-lg">
            Questions about a piece, an order, or a custom commission — I read
            every message personally and respond within 2–3 days.
          </p>
        </div>
      </section>

      {/* Custom Commissions Callout */}
      <section
        aria-labelledby="commissions-heading"
        className="border-b border-accent/20 bg-accent/5 px-6 py-12 sm:py-16"
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
            <span className="font-bebas-neue text-4xl text-accent sm:text-5xl">
              ★
            </span>
            <div>
              <h2
                id="commissions-heading"
                className="font-bebas-neue text-2xl tracking-wider text-foreground sm:text-3xl"
              >
                Custom Commissions Are Open
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Have a jersey collecting dust — a childhood favorite, a traded
                player, a piece of your team&apos;s history? Send it to me and
                I&apos;ll transform it into something you&apos;ll actually wear.
                Fill out the form below and tell me about your piece.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section
        aria-labelledby="form-heading"
        className="bg-background px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <h2
            id="form-heading"
            className="mb-8 font-bebas-neue text-3xl tracking-wider text-foreground sm:text-4xl"
          >
            Request a Custom
          </h2>
          <ContactForm />
          <p className="mt-8 text-sm text-muted-foreground">
            Prefer email?{" "}
            <a
              href="mailto:hello@augustjones.shop"
              className="text-foreground underline hover:no-underline"
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
