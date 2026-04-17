import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import {
  type AugustJonesEvent,
  EVENT_TIMEZONE,
  formatEventDate,
  formatEventDateRange,
  formatEventTime,
  getEventDescription,
  getEventName,
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
      className="bg-[#f6f4f0] p-8 target:ring-2 target:ring-[#ffb612] sm:p-10"
    >
      <h2 className="mb-3 font-bebas-neue text-3xl tracking-wide text-[#222] sm:text-4xl">
        {getEventName(event)}
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

        {sessions.map((session) => {
          const sessionLabel = isMultiDay
            ? new Date(session.startDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                timeZone: EVENT_TIMEZONE,
              })
            : undefined;

          return (
            <AddToCalendarButton
              key={session.startDate}
              name={
                sessionLabel
                  ? `${getEventName(event)} – ${sessionLabel}`
                  : getEventName(event)
              }
              startDate={getCalendarDate(session.startDate)}
              startTime={getCalendarTime(session.startDate)}
              endDate={getCalendarDate(session.endDate)}
              endTime={getCalendarTime(session.endDate)}
              timeZone={EVENT_TIMEZONE}
              location={`${event.address.street}, ${event.address.city}, ${event.address.state} ${event.address.zip}`}
              description={getEventDescription(event)}
              options={["Apple", "Google", "iCal", "Outlook.com"]}
              buttonStyle="flat"
              lightMode="dark"
            />
          );
        })}
      </div>
    </article>
  );
}
