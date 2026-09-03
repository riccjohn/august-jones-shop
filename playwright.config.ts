import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:3001",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      testIgnore: /.*\.flag-off\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      testIgnore: /.*\.flag-off\.spec\.ts$/,
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      testIgnore: /.*\.flag-off\.spec\.ts$/,
      use: { ...devices["Desktop Safari"] },
    },

    // Flag-off (production-default) build — email signup disabled. Only runs
    // specs matching *.flag-off.spec.ts against the port-3002 server below.
    {
      name: "chromium-flag-off",
      testMatch: /.*\.flag-off\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3002" },
    },
  ],

  webServer: [
    {
      command:
        "E2E_TEST=true NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED=true pnpm build && serve out --listen 3001",
      url: "http://localhost:3001",
      // Kill the port-3001 process to force a rebuild after fixture or page changes.
      reuseExistingServer: !process.env.CI,
      timeout: 300000,
    },
    {
      // No NEXT_PUBLIC_EMAIL_SIGNUP_ENABLED override — exercises the real
      // production default (EMAIL_SIGNUP_ENABLED === false). Builds into its
      // own `out-flag-off/` dir (via E2E_OUT_DIR) so it can't clobber the
      // flag-on build's `out/` while that server is still serving from it.
      command:
        "E2E_TEST=true E2E_OUT_DIR=out-flag-off pnpm build && serve out-flag-off --listen 3002",
      url: "http://localhost:3002",
      // Kill the port-3002 process to force a rebuild after fixture or page changes.
      reuseExistingServer: !process.env.CI,
      timeout: 300000,
    },
  ],
});
