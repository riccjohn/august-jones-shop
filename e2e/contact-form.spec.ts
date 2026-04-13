import { expect, test } from "@playwright/test";

const fillForm = async (
  page: import("@playwright/test").Page,
  message = "I have a jersey I'd love transformed.",
) => {
  await page.getByLabel("Name").fill("Jane Smith");
  await page.getByLabel("Email").fill("jane@example.com");
  await page
    .getByRole("textbox", { name: "Tell me about your custom request" })
    .fill(message);
};

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("renders form fields and submit button", async ({ page }) => {
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Tell me about your custom request" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /request a custom/i }),
    ).toBeVisible();
  });

  test("submit button is enabled once name, email, and message are filled", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: /request a custom/i });
    await expect(button).toBeEnabled();

    await fillForm(page);
    await expect(button).toBeEnabled();
  });

  test("shows success state after successful submission", async ({ page }) => {
    await page.route("/api/contact", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await fillForm(page);
    await page.getByRole("button", { name: /request a custom/i }).click();

    await expect(page.getByText("Request Received")).toBeVisible();
  });

  test("sends correct payload to /api/contact", async ({ page }) => {
    let capturedBody: Record<string, string> = {};

    await page.route("/api/contact", async (route) => {
      capturedBody = JSON.parse(route.request().postData() ?? "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await fillForm(page);
    await page.getByRole("button", { name: /request a custom/i }).click();

    await expect(page.getByText("Request Received")).toBeVisible();

    expect(capturedBody.name).toBe("Jane Smith");
    expect(capturedBody.email).toBe("jane@example.com");
    expect(capturedBody.subject).toBe("custom-commission");
    expect(capturedBody.message).toBe("I have a jersey I'd love transformed.");
  });

  test("shows error state when submission fails", async ({ page }) => {
    await page.route("/api/contact", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "internal error" }),
      }),
    );

    await fillForm(page);
    await page.getByRole("button", { name: /request a custom/i }).click();

    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(
      page
        .locator("form")
        .getByRole("link", { name: /customs@augustjones\.shop/i }),
    ).toBeVisible();
  });
});
