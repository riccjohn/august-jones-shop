import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { EventsSchema } from "@/components/EventsSchema";
import { Footer } from "@/components/Footer";
import { getUpcomingEvents } from "@/data/events";

export const metadata: Metadata = {
  title: "Upcoming Events & Pop-Ups | August Jones",
  description:
    "Find August Jones at upcoming pop-up markets and craft fairs in Madison WI, Milwaukee WI, and Chicago IL. Shop one-of-a-kind upcycled sports streetwear in person.",
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
  const events = getUpcomingEvents();

  return (
    <main className="flex min-h-screen flex-col">
      {events.length > 0 && <EventsSchema events={events} />}

      <section className="bg-[#222] px-6 pb-16 pt-16 sm:pb-20 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#ffb612]/70">
            Pop-ups &amp; Markets
          </p>
          <h1
            className="font-bebas-neue text-[#f6f4f0]"
            style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
          >
            Upcoming Events &amp; Pop-Ups
          </h1>
          <p className="mt-4 max-w-xl text-base/relaxed text-[#f6f4f0]/60">
            Find August Jones at pop-up markets and craft fairs in Madison WI,
            Milwaukee WI, and Chicago IL.
          </p>
        </div>
      </section>

      <section className="bg-[#222] px-6 pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          {events.length > 0 ? (
            <div className="flex flex-col gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-lg text-[#f6f4f0]/70">
                No upcoming events right now. Check back soon!
              </p>
              <p className="mb-8 text-sm text-[#f6f4f0]/50">
                Follow us on Instagram for event announcements.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href="https://instagram.com/augustjonesshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffb612] underline"
                >
                  Instagram
                </a>
                <a
                  href="https://www.etsy.com/shop/TheAugustJonesShop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffb612] underline"
                >
                  Shop on Etsy
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
