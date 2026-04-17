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

    // Event cards should be present — we look for a container that holds
    // event details. A date pattern like "Jan 1, 2026" or similar is expected.
    // We look for any element containing a date-like string.
    const datePattern =
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}\b/i;

    const main = page.getByRole("main");

    // Check that the main content area contains a date string
    const mainText = await main.textContent();
    expect(mainText).toMatch(datePattern);

    // Check for at least one visible element that looks like a venue name
    // (non-empty text that acts as a location/venue — look for an address-style element)
    const venueLocator = page.locator('[data-testid="event-venue"]').first();
    await expect(venueLocator).toBeVisible();

    // Check for city text
    const cityLocator = page.locator('[data-testid="event-city"]').first();
    await expect(cityLocator).toBeVisible();
  });

  test("Get Directions link is present with href starting with https://maps.", async ({
    page,
  }) => {
    await page.goto("/events");

    const directionsLink = page
      .getByRole("link", { name: /get directions/i })
      .first();
    await expect(directionsLink).toBeVisible();
    await expect(directionsLink).toHaveAttribute("href", /^https:\/\/maps\./);
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

  // Skipped: The live data always has upcoming events and there is no easy way
  // to force an empty-state render in Playwright without mocking server data.
  // The empty-state UI (check back text, Instagram link, Etsy link) should be
  // tested via a unit/component test against the EventsPage component with an
  // empty events array prop.
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
