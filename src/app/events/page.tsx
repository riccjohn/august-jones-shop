import type { Metadata } from "next";
import { EventListClient } from "@/components/EventListClient";
import { EventsSchema } from "@/components/EventsSchema";
import { Footer } from "@/components/Footer";
import { allEvents, upcomingEvents } from "@/data/event-source";

export const metadata: Metadata = {
  title: "Upcoming Events & Pop-Ups | August Jones",
  description:
    "Find August Jones at upcoming pop-up shops, markets, and craft fairs in Madison WI, Milwaukee WI, and Chicago IL. Shop one-of-a-kind upcycled sports streetwear in person.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    images: [
      {
        url: "/images/product/hoodies.webp",
        alt: "August Jones upcycled sports streetwear",
      },
    ],
  },
};

export default function EventsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {upcomingEvents.length > 0 && <EventsSchema events={upcomingEvents} />}

      <section
        className="bg-[#222] px-6 pb-16 pt-16 sm:pb-20 sm:pt-24"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(255,182,18,0.04) 14px, rgba(255,182,18,0.04) 15px)",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#ffb612]/70">
            Pop-ups &amp; Markets
          </p>
          <h1
            className="font-bebas-neue leading-none text-[#f6f4f0]"
            style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
          >
            Upcoming Pop-Ups
            <br />
            &amp; Markets
          </h1>
          <p className="mt-4 max-w-xl text-base/relaxed text-[#f6f4f0]/80">
            Find August Jones at pop-up shops and markets in Madison, Milwaukee,
            Chicago, and more.
          </p>
        </div>
      </section>

      <section className="bg-[#222] px-6 pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          <EventListClient events={allEvents} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
