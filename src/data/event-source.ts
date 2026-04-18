import { allEvents, getUpcomingEvents } from "./events";

export { allEvents };
export const upcomingEvents = getUpcomingEvents(undefined, new Date());
