// @vitest-environment node
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  // trailingSlash: true means /about 308-redirects to /about/, which is also the
  // canonical. Sitemap URLs must be the final URL, not one that redirects.
  it("lists every URL with a trailing slash", () => {
    for (const { url } of sitemap()) {
      expect(url).toMatch(/\/$/);
    }
  });
});
