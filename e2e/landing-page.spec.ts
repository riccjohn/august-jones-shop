import { expect, test } from "@playwright/test";

/**
 * Comprehensive E2E tests for the August Jones landing page
 * Tests cover visual elements, functionality, responsiveness, and accessibility
 */

const BASE_URL = "http://localhost:3000";

test.describe("Landing Page - Visual & Content", () => {
  test("should have correct page title and metadata", async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify page title
    await expect(page).toHaveTitle("August Jones | Renewed Fashion");

    // Verify meta description is present
    const metaDescription = await page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      "content",
      /Hand-made, one-of-a-kind upcycled sports fashion/,
    );
  });

  test("should display brand logo with proper attributes", async ({ page }) => {
    await page.goto(BASE_URL);

    // Find the logo image
    const logo = page.getByRole("img", { name: /August Jones - Renewed Fashion/i });

    // Verify logo is visible
    await expect(logo).toBeVisible();

    // Verify logo has proper alt text
    await expect(logo).toHaveAttribute("alt", "August Jones - Renewed Fashion");

    // Verify logo source
    const src = await logo.getAttribute("src");
    expect(src).toContain("August_Jones_Logo.svg");
  });

  test("should display About Us section with brand description", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Check for the about section using the aria-labelledby relationship
    const aboutSection = page.locator('section[aria-labelledby="about-heading"]');
    await expect(aboutSection).toBeVisible();

    // Verify the description text is present
    await expect(aboutSection).toContainText("Every piece tells a story");
    await expect(aboutSection).toContainText("NFL jerseys");
    await expect(aboutSection).toContainText("sustainable fashion");
  });

  test("should display all three CTA buttons", async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify Shop Now button
    const shopButton = page.getByRole("link", { name: /Shop Now/i });
    await expect(shopButton).toBeVisible();

    // Verify Instagram button
    const instagramButton = page.getByRole("link", { name: /@augustjonesshop/i });
    await expect(instagramButton).toBeVisible();

    // Verify Email button
    const emailButton = page.getByRole("link", { name: /hello@augustjones\.shop/i });
    await expect(emailButton).toBeVisible();
  });

  test("should display product grid with 4 images", async ({ page }) => {
    await page.goto(BASE_URL);

    // Find the products section
    const productsSection = page.locator('section[aria-labelledby="products-heading"]');
    await expect(productsSection).toBeVisible();

    // Get all product images in the grid
    const productImages = productsSection.locator("img");

    // Verify there are exactly 4 product images
    await expect(productImages).toHaveCount(4);

    // Verify all images are visible
    for (let i = 0; i < 4; i++) {
      await expect(productImages.nth(i)).toBeVisible();
    }

    // Verify all images have alt text
    for (let i = 0; i < 4; i++) {
      const altText = await productImages.nth(i).getAttribute("alt");
      expect(altText).toBeTruthy();
      expect(altText).toContain("August Jones");
    }
  });
});

test.describe("Landing Page - Functionality", () => {
  test("Shop Now button should link to Etsy store", async ({ page }) => {
    await page.goto(BASE_URL);

    const shopButton = page.getByRole("link", { name: /Shop Now/i });

    // Verify href attribute
    await expect(shopButton).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/TheAugustJonesShop",
    );

    // Verify it opens in a new tab
    await expect(shopButton).toHaveAttribute("target", "_blank");

    // Verify security attributes
    await expect(shopButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Instagram button should link to Instagram profile", async ({ page }) => {
    await page.goto(BASE_URL);

    const instagramButton = page.getByRole("link", { name: /@augustjonesshop/i });

    // Verify href attribute
    await expect(instagramButton).toHaveAttribute(
      "href",
      "https://instagram.com/augustjonesshop",
    );

    // Verify it opens in a new tab
    await expect(instagramButton).toHaveAttribute("target", "_blank");

    // Verify security attributes
    await expect(instagramButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Email button should have correct mailto link", async ({ page }) => {
    await page.goto(BASE_URL);

    const emailButton = page.getByRole("link", { name: /hello@augustjones\.shop/i });

    // Verify mailto href
    await expect(emailButton).toHaveAttribute("href", "mailto:hello@augustjones.shop");

    // Verify security attributes
    await expect(emailButton).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("all external links should have proper security attributes", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // Get all links with target="_blank"
    const externalLinks = page.locator('a[target="_blank"]');

    // Should have 2 external links (Etsy and Instagram)
    await expect(externalLinks).toHaveCount(2);

    // Verify each has proper rel attribute
    for (let i = 0; i < 2; i++) {
      const rel = await externalLinks.nth(i).getAttribute("rel");
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });
});

test.describe("Landing Page - Responsive Design", () => {
  test("desktop viewport: product grid should be 2x2", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE_URL);

    const productGrid = page.locator('section[aria-labelledby="products-heading"] > div');

    // Check grid has 2 columns on desktop (sm:grid-cols-2)
    const gridClass = await productGrid.getAttribute("class");
    expect(gridClass).toContain("grid-cols-1");
    expect(gridClass).toContain("sm:grid-cols-2");

    // Get bounding boxes of first two images to verify they're side by side
    const images = page.locator('section[aria-labelledby="products-heading"] img');
    const firstImageBox = await images.nth(0).boundingBox();
    const secondImageBox = await images.nth(1).boundingBox();

    // On desktop, images should be side by side (different x positions, same row)
    expect(firstImageBox).toBeTruthy();
    expect(secondImageBox).toBeTruthy();
    if (firstImageBox && secondImageBox) {
      expect(firstImageBox.x).toBeLessThan(secondImageBox.x);
      // Y positions should be similar (same row)
      expect(Math.abs(firstImageBox.y - secondImageBox.y)).toBeLessThan(10);
    }
  });

  test("mobile viewport: product grid should be single column", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    const productGrid = page.locator('section[aria-labelledby="products-heading"] > div');

    // Check grid classes
    const gridClass = await productGrid.getAttribute("class");
    expect(gridClass).toContain("grid-cols-1");

    // Get bounding boxes of first two images to verify they're stacked
    const images = page.locator('section[aria-labelledby="products-heading"] img');
    const firstImageBox = await images.nth(0).boundingBox();
    const secondImageBox = await images.nth(1).boundingBox();

    // On mobile, images should be stacked (similar x positions, different y)
    expect(firstImageBox).toBeTruthy();
    expect(secondImageBox).toBeTruthy();
    if (firstImageBox && secondImageBox) {
      // Images should be vertically stacked
      expect(firstImageBox.y).toBeLessThan(secondImageBox.y);
      // X positions should be similar (same column)
      expect(Math.abs(firstImageBox.x - secondImageBox.x)).toBeLessThan(50);
    }
  });

  test("logo should scale appropriately at different breakpoints", async ({
    page,
  }) => {
    const logo = page.getByRole("img", { name: "August Jones - Renewed Fashion" });

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await logo.waitFor({ state: "visible" });
    const mobileBox = await logo.boundingBox();

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState("domcontentloaded");
    const tabletBox = await logo.boundingBox();

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState("domcontentloaded");
    const desktopBox = await logo.boundingBox();

    // Verify logo scales up with viewport size
    expect(mobileBox).toBeTruthy();
    expect(tabletBox).toBeTruthy();
    expect(desktopBox).toBeTruthy();

    if (mobileBox && tabletBox && desktopBox) {
      // Logo should be larger on tablet than mobile
      expect(tabletBox.width).toBeGreaterThanOrEqual(mobileBox.width);
      // Logo should be larger on desktop than tablet
      expect(desktopBox.width).toBeGreaterThanOrEqual(tabletBox.width);
    }
  });

  test("buttons should be full width on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    const shopButton = page.getByRole("link", { name: /Shop Now/i });
    const buttonBox = await shopButton.boundingBox();
    const viewportWidth = page.viewportSize()?.width;

    expect(buttonBox).toBeTruthy();
    expect(viewportWidth).toBeTruthy();

    if (buttonBox && viewportWidth) {
      // Button should take up most of the width (accounting for padding)
      // We expect it to be at least 80% of viewport width
      expect(buttonBox.width).toBeGreaterThan(viewportWidth * 0.8);
    }
  });
});

test.describe("Landing Page - Accessibility", () => {
  test("should have proper semantic HTML structure", async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify main element exists
    const main = page.locator("main");
    await expect(main).toBeVisible();

    // Verify header element exists
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Verify h1 heading exists
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Verify navigation element exists
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();

    // Verify nav has proper aria-label
    await expect(nav).toHaveAttribute("aria-label", "Primary navigation");

    // Verify sections have proper headings
    const aboutSection = page.locator('section[aria-labelledby="about-heading"]');
    await expect(aboutSection).toBeVisible();

    const productsSection = page.locator('section[aria-labelledby="products-heading"]');
    await expect(productsSection).toBeVisible();
  });

  test("images should have descriptive alt text", async ({ page }) => {
    await page.goto(BASE_URL);

    // Check logo alt text
    const logo = page.getByRole("img", { name: /August Jones - Renewed Fashion/i });
    const logoAlt = await logo.getAttribute("alt");
    expect(logoAlt).toBeTruthy();
    expect(logoAlt).toContain("August Jones");

    // Check product images have alt text
    const productImages = page.locator('section[aria-labelledby="products-heading"] img');
    const imageCount = await productImages.count();

    for (let i = 0; i < imageCount; i++) {
      const altText = await productImages.nth(i).getAttribute("alt");
      expect(altText).toBeTruthy();
      expect(altText?.length).toBeGreaterThan(0);
    }
  });

  test("keyboard navigation should work for all interactive elements", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // All interactive elements
    const shopButton = page.getByRole("link", { name: /Shop Now/i });
    const instagramButton = page.getByRole("link", { name: /@augustjonesshop/i });
    const emailButton = page.getByRole("link", { name: /hello@augustjones\.shop/i });

    // Verify all buttons can receive focus programmatically
    await shopButton.focus();
    await expect(shopButton).toBeFocused();

    await instagramButton.focus();
    await expect(instagramButton).toBeFocused();

    await emailButton.focus();
    await expect(emailButton).toBeFocused();

    // Verify all links are keyboard accessible (have proper href)
    const shopHref = await shopButton.getAttribute("href");
    expect(shopHref).toBe("https://www.etsy.com/shop/TheAugustJonesShop");

    const instagramHref = await instagramButton.getAttribute("href");
    expect(instagramHref).toBe("https://instagram.com/augustjonesshop");

    const emailHref = await emailButton.getAttribute("href");
    expect(emailHref).toBe("mailto:hello@augustjones.shop");

    // Verify none have tabindex=-1 (which would prevent keyboard access)
    const shopTabIndex = await shopButton.getAttribute("tabindex");
    expect(shopTabIndex).not.toBe("-1");

    const instagramTabIndex = await instagramButton.getAttribute("tabindex");
    expect(instagramTabIndex).not.toBe("-1");

    const emailTabIndex = await emailButton.getAttribute("tabindex");
    expect(emailTabIndex).not.toBe("-1");
  });

  test("focus states should be visible", async ({ page }) => {
    await page.goto(BASE_URL);

    const shopButton = page.getByRole("link", { name: /Shop Now/i });

    // Focus the button
    await shopButton.focus();

    // Check that outline or ring is applied (Tailwind focus styles)
    const styles = await shopButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        outlineStyle: computed.outlineStyle,
        boxShadow: computed.boxShadow,
      };
    });

    // Should have either outline or box-shadow (focus ring)
    const hasFocusStyle =
      styles.outlineWidth !== "0px" ||
      styles.outlineStyle !== "none" ||
      styles.boxShadow !== "none";

    expect(hasFocusStyle).toBe(true);
  });

  test("should have proper ARIA landmarks and labels", async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify main landmark
    const main = page.getByRole("main");
    await expect(main).toBeVisible();

    // Verify navigation landmark with label
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(nav).toBeVisible();

    // Verify heading structure
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check that sections use aria-labelledby
    const aboutSection = page.locator('section[aria-labelledby="about-heading"]');
    const aboutHeading = page.locator("#about-heading");
    await expect(aboutSection).toBeVisible();
    await expect(aboutHeading).toBeAttached(); // sr-only headings are not in viewport

    const productsSection = page.locator('section[aria-labelledby="products-heading"]');
    const productsHeading = page.locator("#products-heading");
    await expect(productsSection).toBeVisible();
    await expect(productsHeading).toBeAttached(); // sr-only headings are not in viewport
  });

  test("decorative icons should be hidden from screen readers", async ({ page }) => {
    await page.goto(BASE_URL);

    // Instagram icon should have aria-hidden="true"
    const instagramIcon = page.locator('svg[aria-hidden="true"]').first();
    await expect(instagramIcon).toHaveAttribute("aria-hidden", "true");

    // Mail icon should have aria-hidden="true"
    const mailIcon = page.locator('svg[aria-hidden="true"]').nth(1);
    await expect(mailIcon).toHaveAttribute("aria-hidden", "true");
  });
});

test.describe("Landing Page - User Journey", () => {
  test("complete user journey: view content and navigate to shop", async ({
    page,
  }) => {
    // User lands on homepage
    await page.goto(BASE_URL);

    // User sees the brand logo
    const logo = page.getByRole("img", { name: "August Jones - Renewed Fashion" });
    await expect(logo).toBeVisible();

    // User reads the about section
    await expect(page.getByText(/Every piece tells a story/i)).toBeVisible();

    // User views product images
    const productImages = page.locator('section[aria-labelledby="products-heading"] img');
    await expect(productImages.first()).toBeVisible();

    // User decides to shop and clicks Shop Now
    const shopButton = page.getByRole("link", { name: /Shop Now/i });
    await expect(shopButton).toBeEnabled();

    // Verify the link will open in new tab with correct URL
    const href = await shopButton.getAttribute("href");
    expect(href).toBe("https://www.etsy.com/shop/TheAugustJonesShop");
  });

  test("social media engagement journey: find and navigate to Instagram", async ({
    page,
  }) => {
    await page.goto(BASE_URL);

    // User sees Instagram button
    const instagramButton = page.getByRole("link", { name: /@augustjonesshop/i });
    await expect(instagramButton).toBeVisible();

    // User can identify it as Instagram link
    await expect(instagramButton).toContainText("@augustjonesshop");

    // Verify link opens Instagram profile
    const href = await instagramButton.getAttribute("href");
    expect(href).toBe("https://instagram.com/augustjonesshop");

    // Verify it opens in new tab
    await expect(instagramButton).toHaveAttribute("target", "_blank");
  });

  test("contact journey: user wants to email the brand", async ({ page }) => {
    await page.goto(BASE_URL);

    // User looks for contact option
    const emailButton = page.getByRole("link", { name: /hello@augustjones\.shop/i });
    await expect(emailButton).toBeVisible();

    // User can see the email address
    await expect(emailButton).toContainText("hello@augustjones.shop");

    // Verify mailto link
    const href = await emailButton.getAttribute("href");
    expect(href).toBe("mailto:hello@augustjones.shop");
  });
});
