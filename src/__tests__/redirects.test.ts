// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rules = readFileSync(
  resolve(__dirname, "../../public/_redirects"),
  "utf8",
)
  .split(/\r?\n/)
  .map((line) => line.replace(/#.*$/, "").trim())
  .filter(Boolean)
  .map((line) => {
    const [from, to, status] = line.split(/\s+/);
    return { from, to, status };
  });

describe("public/_redirects", () => {
  // /contact was the customs page before it moved; old links (Instagram bio,
  // indexed URLs) must land on /customs/ with a permanent redirect.
  it.each(["/contact", "/contact/"])("301s %s to /customs/", (from) => {
    expect(rules).toContainEqual({ from, to: "/customs/", status: "301" });
  });

  it("never redirects away from /customs", () => {
    expect(rules.some((rule) => rule.from.startsWith("/customs"))).toBe(false);
  });
});
