import { expect, test } from "@playwright/test";

/**
 * High-level E2E tests for the August Jones landing page.
 * Focus on critical content, key links, and basic accessibility — not implementation details.
 */

const BASE_URL = "http://localhost:3000";

test.describe("Landing Page", () => {
  test("loads with correct title and key content visible", async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page).toHaveTitle("August Jones | Renewed Fashion");

    await expect(
      page.getByRole("img", { name: /August Jones - Renewed Fashion/i }),
    ).toBeVisible();
    await expect(page.getByText(/Every piece tells a story/i)).toBeVisible();
    await expect(
      page.locator('section[aria-labelledby="products-heading"]'),
    ).toBeVisible();
    await expect(page.getByText(/Get in Touch/i)).toBeVisible();
  });

  test("primary CTA and contact links are present and work", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    const shopLink = page.getByRole("link", { name: /Shop Now/i });
    await expect(shopLink).toBeVisible();
    await expect(shopLink).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/TheAugustJonesShop",
    );
    await expect(shopLink).toHaveAttribute("target", "_blank");

    const instagramLink = page.getByRole("link", {
      name: /@augustjonesshop/i,
    }).first();
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );

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
  });
});
