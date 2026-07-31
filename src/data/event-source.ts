import {
  getUpcomingEvents,
  sortEventsByDate,
  allEvents as unsortedEvents,
} from "./events";

export const allEvents = sortEventsByDate(unsortedEvents);
export const upcomingEvents = getUpcomingEvents(allEvents, new Date());
