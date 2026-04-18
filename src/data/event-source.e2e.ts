import { getUpcomingEvents } from "./events";
import { fixtureEvents } from "./events.fixture";

// Frozen at fixture date so the filter cutoff and TODAY/TOMORROW badges are deterministic.
export const now = new Date("2099-06-15T12:00:00-05:00");
export const upcomingEvents = getUpcomingEvents(fixtureEvents, now);
