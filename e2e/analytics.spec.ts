import { expect, type Page, test } from "@playwright/test";

// We stub window.umami before page scripts run so that tracking calls
// are captured synchronously in window.__umamiCalls. The real Umami script
// is blocked via page.route() so our stub is never overwritten.
declare global {
  interface Window {
    __umamiCalls: Array<{
      eventName: string;
      eventData?: Record<string, string>;
    }>;
  }
}

async function getLastUmamiCall(
  page: Page,
): Promise<{ eventName: string; eventData?: Record<string, string> }> {
  const calls = await page.evaluate(() => window.__umamiCalls);
  if (!calls || calls.length === 0)
    throw new Error("No umami.track calls captured");
  return calls[calls.length - 1];
}

test.describe("Analytics event tracking", () => {
  test.beforeEach(async ({ page }) => {
    // Block the real Umami script so our stub is not overwritten
    await page.route("https://cloud.umami.is/script.js", (route) =>
      route.fulfill({ status: 200, contentType: "text/javascript", body: "" }),
    );

    // Stub window.umami before page scripts run
    await page.addInitScript(() => {
      window.__umamiCalls = [];
      window.umami = {
        track: (eventName, eventData) => {
          window.__umamiCalls.push({ eventName, eventData });
        },
      };
    });
  });

  test("hero Shop Now click sends shopify_store_click with source=hero", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByLabel("Primary navigation")
      .getByRole("link", { name: /Shop Now/i })
      .click({ modifiers: ["Alt"] });

    const call = await getLastUmamiCall(page);
    expect(call.eventName).toBe("shopify_store_click");
    expect(call.eventData?.source).toBe("hero");
  });

  test("footer Shop Now click sends shopify_store_click with source=footer", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByLabel("Footer navigation")
      .getByRole("link", { name: /Shop Now/i })
      .click({ modifiers: ["Alt"] });

    const call = await getLastUmamiCall(page);
    expect(call.eventName).toBe("shopify_store_click");
    expect(call.eventData?.source).toBe("footer");
  });

  test("gallery item click sends shopify_store_click with source starting with gallery_", async ({
    page,
  }) => {
    await page.goto("/");

    const galleryLink = page
      .locator('section[aria-labelledby="products-heading"]')
      .getByRole("link")
      .first();

    await galleryLink.click({ modifiers: ["Alt"] });

    const call = await getLastUmamiCall(page);
    expect(call.eventName).toBe("shopify_store_click");
    expect(call.eventData?.source).toMatch(/^gallery_/);
  });

  test("hero Instagram link click sends instagram_click with source=hero", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /@augustjonesshop/i })
      .first()
      .click({ modifiers: ["Alt"] });

    const call = await getLastUmamiCall(page);
    expect(call.eventName).toBe("instagram_click");
    expect(call.eventData?.source).toBe("hero");
  });

  test("footer Instagram link click sends instagram_click with source=footer", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByLabel("August Jones on Instagram")
      .click({ modifiers: ["Alt"] });

    const call = await getLastUmamiCall(page);
    expect(call.eventName).toBe("instagram_click");
    expect(call.eventData?.source).toBe("footer");
  });

  test("email link click sends email_click", async ({ page }) => {
    await page.goto("/");

    // Prevent the mailto: href from triggering a navigation/mail-client launch
    // in WebKit, which can disrupt page.evaluate() before it resolves.
    await page.evaluate(() => {
      document.addEventListener(
        "click",
        (e) => {
          const anchor = (e.target as Element).closest('a[href^="mailto:"]');
          if (anchor) e.preventDefault();
        },
        { capture: true },
      );
    });

    await page.getByRole("link", { name: /hello@augustjones\.shop/i }).click();

    const call = await getLastUmamiCall(page);
    expect(call.eventName).toBe("email_click");
  });
});
