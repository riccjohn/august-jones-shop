import { ExternalLink, MapPin } from "lucide-react";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import { EventUrgencyBadge } from "@/components/EventUrgencyBadge";
import {
  type AugustJonesEvent,
  EVENT_TIMEZONE,
  formatEventDate,
  formatEventTime,
  getEventDescription,
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
  const { sessions } = event;
  const isMultiDay = sessions.length > 1;

  return (
    <article
      id={event.id}
      className="relative bg-[#f6f4f0] p-8 target:ring-2 target:ring-[#ffb612] sm:p-10"
    >
      <EventUrgencyBadge event={event} />
      <h2 className="mb-3 font-bebas-neue text-3xl tracking-wide text-[#222] sm:text-4xl">
        <a
          href={event.eventWebsiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2"
        >
          <span className="group-hover:underline decoration-[#ffb612] underline-offset-2">
            {event.marketName}
          </span>
          <ExternalLink
            className="mb-0.5 h-5 w-5 shrink-0 text-[#222]/35 transition-colors duration-300 group-hover:text-[#ffb612]"
            strokeWidth={2.5}
          />
        </a>
      </h2>

      {isMultiDay ? (
        <div className="mb-4 flex flex-col gap-1">
          {sessions.map((session) => {
            const start = new Date(session.startDate);
            const end = new Date(session.endDate);
            return (
              <p
                key={session.startDate}
                className="text-base font-semibold uppercase tracking-widest text-[#222]/80"
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
          className="mb-4 text-base font-semibold uppercase tracking-widest text-[#222]/80"
          data-testid="event-session-date"
        >
          {formatEventDate(new Date(sessions[0].startDate))} &middot;{" "}
          {formatEventTime(new Date(sessions[0].startDate))}&ndash;
          {formatEventTime(new Date(sessions[0].endDate))}
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-base font-medium text-[#222]/80 underline-offset-2 hover:underline"
          data-testid="event-venue"
        >
          <MapPin className="h-4 w-4 shrink-0 text-[#222]/40" strokeWidth={2} />
          {event.venueName}
        </a>
        <span
          className="border border-[#ffb612]/60 px-2 py-0.5 font-bebas-neue text-sm tracking-widest text-[#222]/70"
          data-testid="event-city"
        >
          {event.address.city}, {event.address.state}
        </span>
      </div>

      <p className="mb-8 text-base/relaxed text-[#222]/70">
        {getEventDescription(event)}
      </p>

      {event.discount && (
        <div className="mb-8 inline-flex items-center gap-3 border border-[#ffb612]/40 bg-[#ffb612]/10 px-4 py-3">
          <span className="text-sm font-medium text-[#222]/70">
            {event.discount.label}:
          </span>
          <code className="font-mono text-sm font-bold tracking-widest text-[#222]">
            {event.discount.code}
          </code>
        </div>
      )}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap">
        {isMultiDay ? (
          <AddToCalendarButton
            name={event.marketName}
            dates={sessions.map((session) => ({
              startDate: getCalendarDate(session.startDate),
              startTime: getCalendarTime(session.startDate),
              endDate: getCalendarDate(session.endDate),
              endTime: getCalendarTime(session.endDate),
              description: getEventDescription(event),
            }))}
            timeZone={EVENT_TIMEZONE}
            location={`${event.address.street}, ${event.address.city}, ${event.address.state} ${event.address.zip}`}
            options={["Apple", "Google", "iCal", "Outlook.com"]}
            buttonStyle="flat"
            lightMode="dark"
          />
        ) : (
          <AddToCalendarButton
            name={event.marketName}
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
