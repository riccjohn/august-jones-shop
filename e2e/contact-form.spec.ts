import { expect, test } from "@playwright/test";

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contact");
  });

  test("renders form fields and submit button", async ({ page }) => {
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /what.s this about/i }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send message/i }),
    ).toBeVisible();
  });

  test("submit button is disabled when no subject is selected", async ({
    page,
  }) => {
    const button = page.getByRole("button", { name: /send message/i });
    await expect(button).toBeDisabled();

    await page.getByLabel("Name").fill("Jane Smith");
    await page.getByLabel("Email").fill("jane@example.com");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("I have a jersey I'd love transformed.");

    // Still disabled — subject not selected
    await expect(button).toBeDisabled();
  });

  test("submit button enables once all fields are filled", async ({ page }) => {
    await page.getByLabel("Name").fill("Jane Smith");
    await page.getByLabel("Email").fill("jane@example.com");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("I have a jersey I'd love transformed.");

    // Select subject via the combobox
    await page.getByRole("combobox", { name: /what.s this about/i }).click();
    await page.getByRole("option", { name: /custom commission/i }).click();

    await expect(
      page.getByRole("button", { name: /send message/i }),
    ).toBeEnabled();
  });

  test("shows success state after successful submission", async ({ page }) => {
    // Intercept /api/contact and return success
    await page.route("/api/contact", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.getByLabel("Name").fill("Jane Smith");
    await page.getByLabel("Email").fill("jane@example.com");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("I have a jersey I'd love transformed.");
    await page.getByRole("combobox", { name: /what.s this about/i }).click();
    await page.getByRole("option", { name: /custom commission/i }).click();

    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText("Message Sent")).toBeVisible();
  });

  test("success submission sends correct payload to /api/contact", async ({
    page,
  }) => {
    let capturedBody: Record<string, string> = {};

    await page.route("/api/contact", async (route) => {
      const request = route.request();
      capturedBody = JSON.parse(request.postData() ?? "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.getByLabel("Name").fill("Jane Smith");
    await page.getByLabel("Email").fill("jane@example.com");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("I have a jersey I'd love transformed.");
    await page.getByRole("combobox", { name: /what.s this about/i }).click();
    await page.getByRole("option", { name: /custom commission/i }).click();

    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page.getByText("Message Sent")).toBeVisible();

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

    await page.getByLabel("Name").fill("Jane Smith");
    await page.getByLabel("Email").fill("jane@example.com");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("I have a jersey I'd love transformed.");
    await page.getByRole("combobox", { name: /what.s this about/i }).click();
    await page.getByRole("option", { name: /custom commission/i }).click();

    await page.getByRole("button", { name: /send message/i }).click();

    // Error message with fallback email link should appear inside the form
    await expect(page.getByText(/something went wrong/i)).toBeVisible();
    await expect(
      page
        .locator("form")
        .getByRole("link", { name: /hello@augustjones\.shop/i }),
    ).toBeVisible();
  });
});
