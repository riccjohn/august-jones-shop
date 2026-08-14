import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * E2E coverage for EmailSignupForm (rendered in the footer on every page, and
 * as the primary form on /join).
 *
 * The e2e webServer runs a plain static file server (`serve out`) — Cloudflare
 * Pages Functions (functions/api/*.ts) do not run in that environment, so a
 * real POST to /api/subscribe would 404. We intercept it with page.route and
 * mock a 200 response instead.
 */

const SUCCESS_MESSAGE = "Thanks for subscribing! You're in.";

/** Mocks /api/subscribe with a 200 JSON response and counts how many times it's called. */
async function mockSubscribe(page: Page) {
  const calls = { count: 0 };
  await page.route("**/api/subscribe", async (route) => {
    calls.count++;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  return calls;
}

/** Sets the honeypot ("website") field's value directly on the DOM node. */
async function fillHoneypot(scope: Page | Locator) {
  await scope.locator('input[name="website"]').evaluate((el) => {
    (el as HTMLInputElement).value = "https://spam.example.com";
  });
}

test.describe("Footer email signup form", () => {
  test("successful submission shows a success message and removes the form", async ({
    page,
  }) => {
    await page.goto("/");
    const calls = await mockSubscribe(page);

    const footer = page.locator("footer");
    await footer.getByLabel("Email").fill("fan@example.com");
    await footer.getByRole("button", { name: "Sign Up" }).click();

    await expect(footer.getByText(SUCCESS_MESSAGE)).toBeVisible();
    await expect(footer.getByLabel("Email")).toHaveCount(0);
    expect(calls.count).toBe(1);
  });

  test("honeypot submission shows the success message without calling the API", async ({
    page,
  }) => {
    await page.goto("/");
    const calls = await mockSubscribe(page);

    const footer = page.locator("footer");
    await footer.getByLabel("Email").fill("fan@example.com");
    await fillHoneypot(footer);
    await footer.getByRole("button", { name: "Sign Up" }).click();

    await expect(footer.getByText(SUCCESS_MESSAGE)).toBeVisible();
    expect(calls.count).toBe(0);
  });
});

test.describe("/join page", () => {
  test("loads with the expected title and canonical link", async ({ page }) => {
    await page.goto("/join");

    await expect(page).toHaveTitle("Join the List | August Jones");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/join\/?$/,
    );
  });

  test("successful submission shows a success message and removes the form", async ({
    page,
  }) => {
    await page.goto("/join");
    const calls = await mockSubscribe(page);

    const formSection = page.locator('section[aria-labelledby="form-heading"]');
    await formSection.getByLabel("Email").fill("fan@example.com");
    await formSection.getByRole("button", { name: "Sign Up" }).click();

    await expect(formSection.getByText(SUCCESS_MESSAGE)).toBeVisible();
    await expect(formSection.getByLabel("Email")).toHaveCount(0);
    expect(calls.count).toBe(1);
  });

  test("honeypot submission shows the success message without calling the API", async ({
    page,
  }) => {
    await page.goto("/join");
    const calls = await mockSubscribe(page);

    const formSection = page.locator('section[aria-labelledby="form-heading"]');
    await formSection.getByLabel("Email").fill("fan@example.com");
    await fillHoneypot(formSection);
    await formSection.getByRole("button", { name: "Sign Up" }).click();

    await expect(formSection.getByText(SUCCESS_MESSAGE)).toBeVisible();
    expect(calls.count).toBe(0);
  });
});
