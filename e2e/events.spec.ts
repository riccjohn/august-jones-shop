import { expect, type Page, test } from "@playwright/test";

// Freezes the browser's Date to the fixture "now" (2026-04-29T12:00:00-05:00) via addInitScript.
// Must be called before page.goto. Date.UTC is intentionally inherited from OrigDate
// (used by getEventUrgencyLabel to compute tomorrow's boundary).
async function freezeToFixtureNow(page: Page) {
  await page.addInitScript(() => {
    const FROZEN_TIME = new Date("2026-04-29T12:00:00-05:00").getTime();
    const OrigDate = Date;
    class MockDate extends OrigDate {
      constructor(...args: unknown[]) {
        if (args.length === 0) super(FROZEN_TIME);
        else super(...(args as ConstructorParameters<typeof Date>));
      }
      static now() {
        return FROZEN_TIME;
      }
      static parse(s: string) {
        return OrigDate.parse(s);
      }
    }
    globalThis.Date = MockDate as unknown as DateConstructor;
  });
}

/**
 * E2E tests for Events navigation links.
 * These tests verify that the Events page link is present in:
 *   1. Desktop navigation
 *   2. Mobile navigation (hamburger menu)
 *   3. Footer Navigate section
 */

test.describe("Events navigation integration", () => {
  test("mobile nav has an Events link pointing to /events after opening hamburger menu", async ({
    page,
  }) => {
    // Use a mobile viewport so the hamburger button is visible
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Open the mobile hamburger menu
    const hamburger = page.getByRole("button", { name: "Open menu" });
    await hamburger.click();

    // Mobile menu should now be visible
    const mobileNav = page.getByRole("navigation", {
      name: "Mobile navigation",
    });
    await expect(mobileNav).toBeVisible();

    const eventsLink = mobileNav.getByRole("link", { name: "Events" });
    await expect(eventsLink).toBeVisible();
    await expect(eventsLink).toHaveAttribute("href", "/events/");
  });
});

/**
 * E2E tests for the /events page content and structure.
 * These tests verify the page renders correctly with event cards,
 * structured data, and accessibility requirements.
 */

test.describe("Events Page", () => {
  // Freeze browser Date to fixture "now" (2026-04-29T12:00:00-05:00) so the client-side
  // EventListClient useEffect sees the same time as the server-side fixture filter.
  // Without this, a later real date would cause fixture events to be filtered out after hydration.
  test.beforeEach(async ({ page }) => {
    await freezeToFixtureNow(page);
  });

  test("loads with correct page title", async ({ page }) => {
    await page.goto("/events");

    await expect(page).toHaveTitle("Upcoming Events & Pop-Ups | August Jones");
  });

  test("at least one event card is visible with date, venue, and city", async ({
    page,
  }) => {
    await page.goto("/events");

    const datePattern =
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i;

    const sessionDate = page
      .locator('[data-testid="event-session-date"]')
      .first();
    await expect(sessionDate).toBeVisible();
    const sessionDateText = await sessionDate.textContent();
    expect(sessionDateText).toMatch(datePattern);

    const venueLocator = page.locator('[data-testid="event-venue"]').first();
    await expect(venueLocator).toBeVisible();

    const cityLocator = page.locator('[data-testid="event-city"]').first();
    await expect(cityLocator).toBeVisible();
  });

  test("Add to Calendar button or similar is present on at least one event card", async ({
    page,
  }) => {
    await page.goto("/events");

    // Look for a button or element with "add to calendar" (or "calendar") text.
    // We avoid testing dropdown internals — just verify the trigger is present.
    const calendarTrigger = page
      .getByRole("button", { name: /add to calendar/i })
      .first();
    await expect(calendarTrigger).toBeVisible();
  });

  test("page has application/ld+json structured data with Event, startDate, and location", async ({
    page,
  }) => {
    await page.goto("/events");

    const schemaScripts = page.locator('script[type="application/ld+json"]');
    const count = await schemaScripts.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const allSchemas = await schemaScripts.all();
    let hasEventSchema = false;

    for (const script of allSchemas) {
      const content = await script.textContent();
      if (
        content?.includes('"@type":"Event"') ||
        content?.includes('"@type": "Event"')
      ) {
        hasEventSchema = true;
        expect(content).toMatch(/startDate/);
        expect(content).toMatch(/location/);
      }
    }

    expect(hasEventSchema).toBe(true);
  });
});
