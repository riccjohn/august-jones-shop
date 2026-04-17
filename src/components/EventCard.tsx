import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import {
  type AugustJonesEvent,
  EVENT_TIMEZONE,
  formatEventDate,
  formatEventTime,
} from "@/data/events";

interface EventCardProps {
  event: AugustJonesEvent;
}

function getCalendarDate(dateString: string): string {
  return dateString.split("T")[0];
}

function getCalendarTime(dateString: string): string {
  return dateString.split("T")[1].slice(0, 5);
}

export function EventCard({ event }: EventCardProps) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    <article className="bg-[#f6f4f0] p-8 sm:p-10">
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#222]/60">
        {formatEventDate(start)} &middot; {formatEventTime(start)}&ndash;
        {formatEventTime(end)}
      </p>

      <h2 className="mb-4 font-bebas-neue text-3xl tracking-wide text-[#222] sm:text-4xl">
        {event.name}
      </h2>

      <p
        className="mb-1 text-base font-medium text-[#222]/80"
        data-testid="event-venue"
      >
        {event.venueName}
      </p>
      <p className="mb-6 text-sm text-[#222]/60" data-testid="event-city">
        {event.city}
      </p>

      <p className="mb-8 max-w-2xl text-base/relaxed text-[#222]/70">
        {event.description}
      </p>

      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-[#ffb612]/40 px-5 py-2.5 text-sm font-medium tracking-wide text-[#222] transition-colors hover:border-[#ffb612] hover:bg-[#ffb612]"
        >
          Get Directions
        </a>

        <AddToCalendarButton
          name={event.name}
          startDate={getCalendarDate(event.startDate)}
          startTime={getCalendarTime(event.startDate)}
          endDate={getCalendarDate(event.endDate)}
          endTime={getCalendarTime(event.endDate)}
          timeZone={EVENT_TIMEZONE}
          location={`${event.address.street}, ${event.address.city}, ${event.address.state} ${event.address.zip}`}
          description={event.description}
          options={["Apple", "Google", "iCal", "Outlook.com"]}
          buttonStyle="flat"
          lightMode="dark"
        />
      </div>
    </article>
  );
}
