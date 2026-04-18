import type { Metadata } from "next";
import { EventCard } from "@/components/EventCard";
import { EventsSchema } from "@/components/EventsSchema";
import { Footer } from "@/components/Footer";
import { upcomingEvents as events, now } from "@/data/event-source";

export const metadata: Metadata = {
  title: "Upcoming Events & Pop-Ups | August Jones",
  description:
    "Find August Jones at upcoming pop-up markets and craft fairs in Madison WI and Chicago IL. Shop one-of-a-kind upcycled sports streetwear in person.",
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
      {events.length > 0 && <EventsSchema events={events} />}

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
            Find August Jones at pop-up markets and craft fairs near you.
          </p>
        </div>
      </section>

      <section className="bg-[#222] px-6 pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl">
          {events.length > 0 ? (
            <div className="flex flex-col">
              {events.map((event, index) => (
                <div key={event.id}>
                  {index > 0 && <div className="h-px bg-[#ffb612]" />}
                  <EventCard event={event} now={now} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20">
              <h2 className="mb-3 font-bebas-neue text-3xl tracking-wide text-[#f6f4f0] sm:text-4xl">
                Check back soon
              </h2>
              <p className="mb-8 text-base text-[#f6f4f0]/60">
                No events scheduled right now. Follow us on Instagram for
                announcements, or shop our current pieces on Etsy.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.etsy.com/shop/TheAugustJonesShop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#ffb612] px-6 py-3 font-bebas-neue text-lg tracking-widest text-[#222] transition-opacity hover:opacity-90"
                >
                  Shop on Etsy
                </a>
                <a
                  href="https://instagram.com/augustjonesshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border border-[#ffb612]/50 px-6 py-3 font-bebas-neue text-lg tracking-widest text-[#f6f4f0] transition-opacity hover:opacity-90"
                >
                  Follow on Instagram
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
