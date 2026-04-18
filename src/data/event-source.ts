import { getUpcomingEvents } from "./events";

export const now = new Date();
export const upcomingEvents = getUpcomingEvents(undefined, now);
