import { Link, MapPin } from "lucide-react";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import {
  type AugustJonesEvent,
  EVENT_TIMEZONE,
  formatEventDate,
  formatEventTime,
  getEventDescription,
  getEventName,
  getEventUrgencyLabel,
} from "@/data/events";

function buildMultiDayCalendarDescription(event: AugustJonesEvent): string {
  const sessionLines = event.sessions
    .map((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return `${formatEventDate(start)}: ${formatEventTime(start)}–${formatEventTime(end)}`;
    })
    .join("[br]");
  return `${sessionLines}[br][br]${getEventDescription(event)}`;
}

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
  const { sessions } = event;
  const isMultiDay = sessions.length > 1;
  const urgencyLabel = getEventUrgencyLabel(event);

  return (
    <article
      id={event.id}
      className="relative bg-[#f6f4f0] p-8 transition-shadow duration-200 hover:shadow-[4px_4px_0_#ffb612] target:ring-2 target:ring-[#ffb612] sm:p-10"
    >
      {urgencyLabel && (
        <span className="absolute right-0 top-0 bg-[#ffb612] px-3 py-1.5 font-bebas-neue text-base tracking-widest text-[#222]">
          {urgencyLabel}
        </span>
      )}
      <h2 className="mb-3 font-bebas-neue text-3xl tracking-wide text-[#222] sm:text-4xl">
        {event.eventWebsiteUrl ? (
          <a
            href={event.eventWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2"
          >
            <span className="group-hover:underline decoration-[#ffb612] underline-offset-2">
              {getEventName(event)}
            </span>
            <Link
              className="mb-0.5 h-5 w-5 shrink-0 text-[#222]/35 transition-colors duration-300 group-hover:text-[#ffb612]"
              strokeWidth={2.5}
            />
          </a>
        ) : (
          getEventName(event)
        )}
      </h2>

      {isMultiDay ? (
        <div className="mb-4 flex flex-col gap-1">
          {sessions.map((session) => {
            const start = new Date(session.startDate);
            const end = new Date(session.endDate);
            return (
              <p
                key={session.startDate}
                className="text-sm font-semibold uppercase tracking-widest text-[#222]/60"
                data-testid="event-session-date"
              >
                {formatEventDate(start)} &middot; {formatEventTime(start)}
                &ndash;
                {formatEventTime(end)}
              </p>
            );
          })}
        </div>
      ) : (
        <p
          className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#222]/60"
          data-testid="event-session-date"
        >
          {formatEventDate(new Date(sessions[0].startDate))} &middot;{" "}
          {formatEventTime(new Date(sessions[0].startDate))}&ndash;
          {formatEventTime(new Date(sessions[0].endDate))}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p
          className="flex items-center gap-1.5 text-base font-medium text-[#222]/80"
          data-testid="event-venue"
        >
          <MapPin className="h-4 w-4 shrink-0 text-[#222]/40" strokeWidth={2} />
          {event.venueName}
        </p>
        <span
          className="border border-[#ffb612]/60 px-2 py-0.5 font-bebas-neue text-sm tracking-widest text-[#222]/70"
          data-testid="event-city"
        >
          {event.city}
        </span>
      </div>

      <p className="mb-8 text-base/relaxed text-[#222]/70">
        {getEventDescription(event)}
      </p>

      {event.entryFeeDiscountCode && (
        <div className="mb-8 inline-flex items-center gap-3 border border-[#ffb612]/40 bg-[#ffb612]/10 px-4 py-3">
          <span className="text-sm font-medium text-[#222]/70">
            Entry fee discount:
          </span>
          <code className="font-mono text-sm font-bold tracking-widest text-[#222]">
            {event.entryFeeDiscountCode}
          </code>
        </div>
      )}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-[#ffb612]/40 px-5 py-2.5 text-sm font-medium tracking-wide text-[#222] transition-colors hover:border-[#ffb612] hover:bg-[#ffb612]"
        >
          Get Directions
        </a>

        {isMultiDay ? (
          <AddToCalendarButton
            name={getEventName(event)}
            startDate={getCalendarDate(sessions[0].startDate)}
            endDate={getCalendarDate(sessions[sessions.length - 1].endDate)}
            timeZone={EVENT_TIMEZONE}
            location={`${event.address.street}, ${event.address.city}, ${event.address.state} ${event.address.zip}`}
            description={buildMultiDayCalendarDescription(event)}
            options={["Apple", "Google", "iCal", "Outlook.com"]}
            buttonStyle="flat"
            lightMode="dark"
          />
        ) : (
          <AddToCalendarButton
            name={getEventName(event)}
            startDate={getCalendarDate(sessions[0].startDate)}
            startTime={getCalendarTime(sessions[0].startDate)}
            endDate={getCalendarDate(sessions[0].endDate)}
            endTime={getCalendarTime(sessions[0].endDate)}
            timeZone={EVENT_TIMEZONE}
            location={`${event.address.street}, ${event.address.city}, ${event.address.state} ${event.address.zip}`}
            description={getEventDescription(event)}
            options={["Apple", "Google", "iCal", "Outlook.com"]}
            buttonStyle="flat"
            lightMode="dark"
          />
        )}
      </div>
    </article>
  );
}
