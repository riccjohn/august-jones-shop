import { expect, test } from "@playwright/test";

/**
 * High-level E2E tests for the August Jones landing page.
 * Focus on critical content, key links, and basic accessibility — not implementation details.
 */

test.describe("Landing Page", () => {
  test("loads with correct title and key content visible", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(
      "August Jones | Upcycled Fashion for Every Fan",
    );

    // Check for logo — nav logo is the first instance
    await expect(
      page.locator('img[src*="August_Jones"]').first(),
    ).toBeVisible();

    // Check for main heading (line breaks in markup collapse in the a11y name)
    await expect(
      page.getByRole("heading", { name: /Upcycled Fashion For Every Fan/i }),
    ).toBeVisible();

    // Check for key sections
    await expect(
      page.locator('section[aria-labelledby="collection-heading"]'),
    ).toBeVisible();
  });

  test("has basic accessibility structure", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="collection-heading"]'),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeVisible();
  });

  test("footer is present with all expected links", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Check Navigate section
    await expect(footer.getByText("Navigate")).toBeVisible();
    await expect(
      footer.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeVisible();

    // Check Connect section
    await expect(footer.getByText("Connect", { exact: true })).toBeVisible();

    // Check Instagram link in footer
    const footerInstagram = footer.getByLabel("August Jones on Instagram");
    await expect(footerInstagram).toBeVisible();
    await expect(footerInstagram).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );

    // Check email link
    const footerEmail = footer.getByRole("link", {
      name: /contact@augustjones\.shop/i,
    });
    await expect(footerEmail).toBeVisible();

    // Check legal disclaimer
    await expect(
      footer.getByText(/AUGUST JONES is an independent brand/),
    ).toBeVisible();
    await expect(
      footer.getByText(
        /not affiliated with, endorsed by, or connected to any professional sports teams/,
      ),
    ).toBeVisible();

    // Check copyright
    await expect(
      footer.getByText(/© 2026 August Jones. All rights reserved./),
    ).toBeVisible();
    await expect(
      footer.getByText(/Made with love in Madison, WI/),
    ).toBeVisible();
  });

  test("has structured data for SEO", async ({ page }) => {
    await page.goto("/");

    // Get all schema scripts
    const schemaScripts = page.locator('script[type="application/ld+json"]');
    const schemaCount = await schemaScripts.count();
    expect(schemaCount).toBeGreaterThanOrEqual(2);

    // Check for LocalBusiness schema (in layout)
    const allSchemas = await schemaScripts.all();
    let hasLocalBusiness = false;
    let hasItemList = false;

    for (const schema of allSchemas) {
      const content = await schema.textContent();
      if (content?.includes('"@type":"LocalBusiness"')) {
        hasLocalBusiness = true;
        expect(content).toContain("Madison");
        expect(content).toContain("WI");
        expect(content).toContain("contact@augustjones.shop");
      }
      if (content?.includes('"@type":"ItemList"')) {
        hasItemList = true;
        expect(content).toContain('"@type":"Product"');
      }
    }

    expect(hasLocalBusiness).toBe(true);
    expect(hasItemList).toBe(true);
  });
});
