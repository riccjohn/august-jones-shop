import { upcomingEvents } from "@/data/event-source";
import { formatEventDateRange, formatEventTime } from "@/data/events";
import { cn } from "@/lib/utils";

export function EventsTeaser() {
  const events = upcomingEvents.slice(0, 2);

  if (events.length === 0) return null;

  return (
    <section
      aria-labelledby="events-teaser-heading"
      className="bg-[#f6f4f0] px-6 py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-eyebrow mb-4 text-[#222]/60">Catch Us Live</p>
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2
            id="events-teaser-heading"
            className="text-display text-[#222]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Upcoming Pop-Ups &amp; Markets
          </h2>
        </div>
        <div className="flex flex-col">
          {events.map((event, i) => {
            const firstSession = event.sessions[0];
            const start = new Date(firstSession.startDate);
            const isMultiDay = event.sessions.length > 1;

            return (
              <div
                key={event.id}
                className={cn(
                  "flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between",
                  i < events.length - 1 ? "border-b border-[#222]/15" : "",
                )}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-eyebrow text-[#222]/55">
                    {isMultiDay
                      ? formatEventDateRange(event)
                      : (() => {
                          const end = new Date(firstSession.endDate);
                          return (
                            <>
                              {formatEventDateRange(event)} —{" "}
                              {formatEventTime(start)}–{formatEventTime(end)}
                            </>
                          );
                        })()}
                  </p>
                  <p
                    className="text-display text-[#222]"
                    style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                  >
                    {event.marketName}
                  </p>
                  <p className="text-eyebrow text-[#222]/55">
                    {event.address.city}, {event.address.state}
                  </p>
                </div>
                <a
                  href={`/events/#${event.id}`}
                  className="text-eyebrow shrink-0 text-[#222]/70 underline underline-offset-4 hover:text-[#ffb612] hover:no-underline"
                >
                  Details ↗
                </a>
              </div>
            );
          })}
        </div>
        <div className="mt-10 border-t border-[#222]/15 pt-8">
          <a
            href="/events/"
            className="text-eyebrow text-[#222]/70 underline underline-offset-4 hover:text-[#ffb612] hover:no-underline"
          >
            See all events →
          </a>
        </div>
      </div>
    </section>
  );
}
