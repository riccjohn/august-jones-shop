import { expect, test } from "@playwright/test";

/**
 * High-level E2E tests for the August Jones landing page.
 * Focus on critical content, key links, and basic accessibility — not implementation details.
 */

const BASE_URL = "http://localhost:3000";

test.describe("Landing Page", () => {
  test("loads with correct title and key content visible", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page).toHaveTitle(
      "August Jones | Upcycled Sports Fashion from Wisconsin",
    );

    // Check for logo (has empty alt since it's decorative with aria-hidden)
    await expect(page.locator('img[src*="August_Jones_Logo"]')).toBeVisible();

    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /Upcycled Fashion for Every Fan/i }),
    ).toBeVisible();

    // Check for key sections
    await expect(
      page.locator('section[aria-labelledby="about-heading"]'),
    ).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="products-heading"]'),
    ).toBeVisible();
  });

  test("primary CTA and contact links are present and work", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Test hero CTA button specifically (in primary navigation)
    const heroCTA = page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /Shop Now/i });
    await expect(heroCTA).toBeVisible();
    await expect(heroCTA).toHaveAttribute(
      "href",
      /^https:\/\/www\.etsy\.com\/shop\/TheAugustJonesShop\?utm_source=augustjones&utm_medium=website&utm_campaign=shop_cta$/,
    );
    await expect(heroCTA).toHaveAttribute("target", "_blank");

    // Test footer shop link
    const footerShopLink = page
      .getByLabel("Footer navigation")
      .getByRole("link", { name: /Shop Now/i });
    await expect(footerShopLink).toBeVisible();
    await expect(footerShopLink).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/TheAugustJonesShop",
    );

    // Test Instagram link (hero section)
    const instagramLink = page.getByRole("link", {
      name: /@augustjonesshop/i,
    }).first();
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );

    // Test email link in footer
    const emailLink = page.getByRole("link", {
      name: /hello@augustjones\.shop/i,
    });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute(
      "href",
      "mailto:hello@augustjones.shop",
    );
  });

  test("has basic accessibility structure", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="about-heading"]'),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeVisible();
  });

  test("product gallery has correct links with UTM tracking", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Check that product gallery section exists
    const gallery = page.locator('section[aria-labelledby="products-heading"]');
    await expect(gallery).toBeVisible();

    // Test individual product links have UTM parameters
    const vestsLink = page.getByRole("link", {
      name: /Vests/i,
    });
    await expect(vestsLink).toBeVisible();
    await expect(vestsLink).toHaveAttribute(
      "href",
      /utm_source=augustjones&utm_medium=website&utm_campaign=gallery_hoodie/,
    );

    const tshirtsLink = page.getByRole("link", {
      name: /T-Shirts/i,
    });
    await expect(tshirtsLink).toHaveAttribute(
      "href",
      /utm_campaign=gallery_streetwear/,
    );

    const hoodiesLink = page.getByRole("link", {
      name: /Hoodies/i,
    });
    await expect(hoodiesLink).toHaveAttribute(
      "href",
      /utm_campaign=gallery_reworked/,
    );

    const jacketsLink = page.getByRole("link", {
      name: /Jackets/i,
    });
    await expect(jacketsLink).toHaveAttribute(
      "href",
      /utm_campaign=gallery_gameday/,
    );
  });

  test("footer is present with all expected links", async ({ page }) => {
    await page.goto(BASE_URL);

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Check Navigate section
    await expect(footer.getByText("Navigate")).toBeVisible();
    await expect(
      footer.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeVisible();

    // Check Connect section
    await expect(footer.getByText("Connect")).toBeVisible();

    // Check Instagram link in footer
    const footerInstagram = footer.getByLabel("August Jones on Instagram");
    await expect(footerInstagram).toBeVisible();
    await expect(footerInstagram).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );

    // Check email link
    const footerEmail = footer.getByRole("link", {
      name: /hello@augustjones\.shop/i,
    });
    await expect(footerEmail).toBeVisible();

    // Check copyright
    await expect(
      footer.getByText(/© 2026 August Jones. All rights reserved./),
    ).toBeVisible();
    await expect(
      footer.getByText(/Made with ❤️ in Madison, WI/),
    ).toBeVisible();
  });

  test("has structured data for SEO", async ({ page }) => {
    await page.goto(BASE_URL);

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
        expect(content).toContain("hello@augustjones.shop");
      }
      if (content?.includes('"@type":"ItemList"')) {
        hasItemList = true;
        expect(content).toContain('"@type":"Product"');
      }
    }

    expect(hasLocalBusiness).toBe(true);
    expect(hasItemList).toBe(true);
  });

  test("Instagram links in different sections have correct tracking", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Hero Instagram link
    const heroInstagram = page
      .getByRole("link", { name: /@augustjonesshop/i })
      .first();
    await expect(heroInstagram).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );
    await expect(heroInstagram).toHaveAttribute("target", "_blank");
    await expect(heroInstagram).toHaveAttribute("rel", "noopener");

    // Footer Instagram link
    const footerInstagram = page.getByLabel("August Jones on Instagram");
    await expect(footerInstagram).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );
    await expect(footerInstagram).toHaveAttribute("target", "_blank");
  });
});
