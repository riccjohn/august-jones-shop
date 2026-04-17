import type { AugustJonesEvent } from "@/data/events";

interface EventsSchemaProps {
  events: AugustJonesEvent[];
}

export function EventsSchema({ events }: EventsSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": events.map((event) => ({
      "@type": "Event",
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: event.venueName,
        address: {
          "@type": "PostalAddress",
          streetAddress: event.address.street,
          addressLocality: event.address.city,
          addressRegion: event.address.state,
          postalCode: event.address.zip,
          addressCountry: "US",
        },
      },
      organizer: {
        "@type": "Organization",
        "@id": "https://www.augustjones.shop/#localbusiness",
        name: "August Jones",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: "Free and open to the public",
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
