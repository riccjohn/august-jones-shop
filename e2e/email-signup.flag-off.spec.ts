import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the flag-OFF (production-default) build, i.e.
 * EMAIL_SIGNUP_ENABLED === false — no NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED
 * override, exactly as Cloudflare Pages deploys today.
 *
 * This runs against the dedicated port-3002 webServer/project
 * ("chromium-flag-off") defined in playwright.config.ts, so it can exercise
 * the real default without disturbing the flag-on specs (which need the
 * signup forms present).
 */

test.describe("Footer with email signup disabled", () => {
  test("Navigate and Connect columns render without a broken layout", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Guards the footer-grid layout regression: with the signup column
    // removed, Navigate and Connect must still both be visible.
    await expect(
      footer.getByRole("navigation", { name: "Footer navigation" }),
    ).toBeVisible();
    await expect(footer.getByText("Navigate")).toBeVisible();
    await expect(footer.getByText("Connect", { exact: true })).toBeVisible();

    // No signup form anywhere in the footer.
    await expect(footer.getByLabel("Email")).toHaveCount(0);
    await expect(footer.locator("form")).toHaveCount(0);
  });
});

test.describe("Homepage with email signup disabled", () => {
  test("'Get First Dibs' signup section is absent", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.locator('section[aria-labelledby="signup-heading"]'),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Get First Dibs" }),
    ).toHaveCount(0);
  });
});

test.describe("Main navigation with email signup disabled", () => {
  test("has no Join link", async ({ page }) => {
    await page.goto("/");

    const mainNav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(mainNav).toBeVisible();
    await expect(mainNav.getByRole("link", { name: "Join" })).toHaveCount(0);
  });
});

test.describe("/join page with email signup disabled", () => {
  test("is still directly reachable and shows the mailto fallback instead of the form", async ({
    page,
  }) => {
    const response = await page.goto("/join");

    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle("Join the List | August Jones");

    const formSection = page.locator('section[aria-labelledby="form-heading"]');
    await expect(formSection).toBeVisible();

    // No signup form — the mailto fallback copy instead.
    await expect(formSection.getByLabel("Email")).toHaveCount(0);
    await expect(formSection.locator("form")).toHaveCount(0);
    await expect(
      formSection.getByText(/Sign-ups are temporarily paused/i),
    ).toBeVisible();

    const mailtoLink = formSection.getByRole("link", {
      name: "contact@augustjones.shop",
    });
    await expect(mailtoLink).toBeVisible();
    await expect(mailtoLink).toHaveAttribute(
      "href",
      "mailto:contact@augustjones.shop",
    );
  });
});
