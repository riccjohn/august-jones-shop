import { expect, type Page, test } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// WebKit does not expose navigator.sendBeacon bodies via Playwright's network
// interception. We spy on sendBeacon at the JS level in the page context
// instead, storing payloads in window.__analyticsPayloads so all browsers work.
declare global {
  interface Window {
    __analyticsPayloads: Record<string, unknown>[];
  }
}

async function capturePayload(page: Page): Promise<Record<string, unknown>> {
  await page.waitForFunction(
    () => (window.__analyticsPayloads?.length ?? 0) > 0,
    { timeout: 5000 },
  );
  const payload = await page.evaluate(() => window.__analyticsPayloads.shift());
  return payload ?? {};
}

test.describe("Analytics event tracking", () => {
  test.beforeEach(async ({ page }) => {
    // Stub the analytics endpoint at the network level
    await page.route("/api/analytics", (route) =>
      route.fulfill({ status: 204 }),
    );

    // Spy on sendBeacon to capture payloads cross-browser
    await page.addInitScript(() => {
      window.__analyticsPayloads = [];
      const orig = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (url, data) => {
        if (
          typeof url === "string" &&
          url.includes("/api/analytics") &&
          data instanceof Blob
        ) {
          data.text().then((text) => {
            try {
              window.__analyticsPayloads.push(
                JSON.parse(text) as Record<string, unknown>,
              );
            } catch {
              // ignore parse errors
            }
          });
        }
        return orig(url, data);
      };
    });
  });

  test("hero Shop Now click sends shopify_store_click with source=hero", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    await page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /Shop Now/i })
      .click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.event).toBe("shopify_store_click");
    expect(payload.source).toBe("hero");
    expect(payload.page).toBe("/");
  });

  test("footer Shop Now click sends shopify_store_click with source=footer", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    await page
      .getByLabel("Footer navigation")
      .getByRole("link", { name: /Shop Now/i })
      .click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.event).toBe("shopify_store_click");
    expect(payload.source).toBe("footer");
  });

  test("gallery item click sends shopify_store_click with source starting with gallery_", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    const galleryLink = page
      .locator('section[aria-labelledby="products-heading"]')
      .getByRole("link")
      .first();

    await galleryLink.click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.event).toBe("shopify_store_click");
    expect(payload.source).toMatch(/^gallery_/);
  });

  test("hero Instagram link click sends instagram_click with source=hero", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    await page
      .getByRole("link", { name: /@augustjonesshop/i })
      .first()
      .click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.event).toBe("instagram_click");
    expect(payload.source).toBe("hero");
  });

  test("footer Instagram link click sends instagram_click with source=footer", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    await page
      .getByLabel("August Jones on Instagram")
      .click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.event).toBe("instagram_click");
    expect(payload.source).toBe("footer");
  });

  test("email link click sends email_click with page=/", async ({ page }) => {
    await page.goto(BASE_URL);

    await page
      .getByRole("link", { name: /hello@augustjones\.shop/i })
      .click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.event).toBe("email_click");
    expect(payload.page).toBe("/");
  });

  test("UTM params in URL are included in analytics payload", async ({
    page,
  }) => {
    await page.goto(
      `${BASE_URL}?utm_source=instagram&utm_medium=bio&utm_campaign=spring_drop`,
    );

    await page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /Shop Now/i })
      .click({ modifiers: ["Alt"] });

    const payload = await capturePayload(page);
    expect(payload.utm_source).toBe("instagram");
    expect(payload.utm_medium).toBe("bio");
    expect(payload.utm_campaign).toBe("spring_drop");
  });
});
