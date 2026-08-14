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

/** Runs the shared success/honeypot assertions for a signup form at `path`, scoped by `locateForm`. */
function testSignupForm(path: string, locateForm: (page: Page) => Locator) {
  test("successful submission shows a success message and removes the form", async ({
    page,
  }) => {
    await page.goto(path);
    const calls = await mockSubscribe(page);

    const form = locateForm(page);
    await form.getByLabel("Email").fill("fan@example.com");
    await form.getByRole("button", { name: "Sign Up" }).click();

    await expect(form.getByText(SUCCESS_MESSAGE)).toBeVisible();
    await expect(form.getByLabel("Email")).toHaveCount(0);
    expect(calls.count).toBe(1);
  });

  test("honeypot submission shows the success message without calling the API", async ({
    page,
  }) => {
    await page.goto(path);
    const calls = await mockSubscribe(page);

    const form = locateForm(page);
    await form.getByLabel("Email").fill("fan@example.com");
    await fillHoneypot(form);
    await form.getByRole("button", { name: "Sign Up" }).click();

    await expect(form.getByText(SUCCESS_MESSAGE)).toBeVisible();
    expect(calls.count).toBe(0);
  });
}

test.describe("Footer email signup form", () => {
  testSignupForm("/", (page) => page.locator("footer"));
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

  testSignupForm("/join", (page) =>
    page.locator('section[aria-labelledby="form-heading"]'),
  );
});
