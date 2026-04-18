import { expect, test } from "@playwright/test";

/**
 * E2E tests for Events navigation links.
 * These tests verify that the Events page link is present in:
 *   1. Desktop navigation
 *   2. Mobile navigation (hamburger menu)
 *   3. Footer Navigate section
 */

test.describe("Events navigation integration", () => {
  test("desktop nav has an Events link pointing to /events", async ({
    page,
  }) => {
    await page.goto("/");

    // The desktop nav links are visible on sm+ screens. We check the main nav
    // for a link with text 'Events' and href '/events'.
    const desktopNav = page.getByRole("navigation", {
      name: "Main navigation",
    });
    const eventsLink = desktopNav.getByRole("link", { name: "Events" });

    await expect(eventsLink).toBeVisible();
    await expect(eventsLink).toHaveAttribute("href", "/events/");
  });

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

  test("footer Navigate section has an Events link pointing to /events", async ({
    page,
  }) => {
    await page.goto("/");

    const footerNav = page.getByRole("navigation", {
      name: "Footer navigation",
    });
    const eventsLink = footerNav.getByRole("link", { name: "Events" });

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
  test("loads with correct page title", async ({ page }) => {
    await page.goto("/events");

    await expect(page).toHaveTitle("Upcoming Events & Pop-Ups | August Jones");
  });

  test("has <main> element (basic accessibility)", async ({ page }) => {
    await page.goto("/events");

    await expect(page.getByRole("main")).toBeVisible();
  });

  test("has h1 with events-related heading text", async ({ page }) => {
    await page.goto("/events");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    // h1 should contain text related to events / pop-ups
    await expect(h1).toContainText(/event|pop.up/i);
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

  test("venue name links to Google Maps", async ({ page }) => {
    await page.goto("/events");

    const venueLink = page.locator('[data-testid="event-venue"]').first();
    await expect(venueLink).toBeVisible();
    await expect(venueLink).toHaveAttribute("href", /^https:\/\/maps\./);
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

  test("event card title links to event website when eventWebsiteUrl is set", async ({
    page,
  }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-single-day-event-2099-06-15");
    await expect(card).toBeVisible();

    const titleLink = card.getByRole("link", {
      name: /fake market: single day/i,
    });
    await expect(titleLink).toBeVisible();
    await expect(titleLink).toHaveAttribute("href", /.+/);
  });

  test("event card shows discount code when present", async ({ page }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-discount-event-2099-06-16");
    await expect(card).toBeVisible();

    await expect(card).toContainText("FIXTURE-CODE");
  });

  // `now` is frozen to 2099-06-15 in event-source.e2e.ts, so fixture-single-day-event
  // (2099-06-15) renders TODAY and fixture-discount-event (2099-06-16) renders TOMORROW.
  test("event card shows TODAY badge for event happening today", async ({
    page,
  }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-single-day-event-2099-06-15");
    await expect(card).toBeVisible();

    const badge = card.locator("span", { hasText: /^TODAY$/ });
    await expect(badge).toBeVisible();
  });

  test("event card shows TOMORROW badge for event happening tomorrow", async ({
    page,
  }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-discount-event-2099-06-16");
    await expect(card).toBeVisible();

    const badge = card.locator("span", { hasText: /^TOMORROW$/ });
    await expect(badge).toBeVisible();
  });

  test("city chip renders correct city text", async ({ page }) => {
    await page.goto("/events");

    const cityChip = page
      .locator('[data-testid="event-city"]')
      .filter({ hasText: /madison/i })
      .first();
    await expect(cityChip).toBeVisible();
  });

  test("multi-day event card shows one session date line per session", async ({
    page,
  }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-multi-day-event-2099-06-17");
    await expect(card).toBeVisible();

    const sessionDates = card.locator('[data-testid="event-session-date"]');
    await expect(sessionDates).toHaveCount(2);
  });

  test("multi-day event card shows a single Add to Calendar button", async ({
    page,
  }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-multi-day-event-2099-06-17");
    await expect(card).toBeVisible();

    const calendarButtons = card.getByRole("button", {
      name: /add to calendar/i,
    });
    await expect(calendarButtons).toHaveCount(1);
  });

  test("single-day event card shows exactly one session date line", async ({
    page,
  }) => {
    await page.goto("/events");

    const card = page.locator("#fixture-single-day-event-2099-06-15");
    await expect(card).toBeVisible();

    const sessionDates = card.locator('[data-testid="event-session-date"]');
    await expect(sessionDates).toHaveCount(1);
  });

  // Skipped: fixture data always has events so the empty state never renders in E2E.
  // Cover with a unit/component test that renders EventsPage with an empty array.
  test.skip("empty state shows 'check back' text, Instagram link, and Etsy link", async ({
    page,
  }) => {
    await page.goto("/events");

    const main = page.getByRole("main");
    await expect(main).toContainText(/check back/i);

    const instagramLink = page
      .getByRole("link", { name: /instagram/i })
      .first();
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute(
      "href",
      /instagram\.com\/augustjonesshop/,
    );

    const etsyLink = page.getByRole("link", { name: /etsy/i }).first();
    await expect(etsyLink).toBeVisible();
    await expect(etsyLink).toHaveAttribute(
      "href",
      /etsy\.com\/shop\/TheAugustJonesShop/,
    );
  });
});
