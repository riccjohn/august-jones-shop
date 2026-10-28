// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Group = { agents: string[]; rules: { type: string; value: string }[] };

function parseRobots(text: string): { groups: Group[]; sitemaps: string[] } {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    if (field === "allow" || field === "disallow") {
      lastWasAgent = false;
      current?.rules.push({ type: field, value });
    }
  }
  return { groups, sitemaps };
}

const BLOCKED = [
  "meta-externalagent",
  "meta-externalads",
  "meta-webindexer",
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Bytespider",
  "Google-Extended",
  "Applebot-Extended",
];

const MUST_STAY_ALLOWED = [
  "facebookexternalhit",
  "meta-externalfetcher",
  "PerplexityBot",
  "Googlebot",
  "Bingbot",
];

const SITEMAP = "https://www.augustjones.shop/sitemap.xml";

// A non-empty Disallow of any shape (/, /*, /about/, /?) restricts crawling.
const hasDisallow = (g: Group) =>
  g.rules.some((r) => r.type === "disallow" && r.value !== "");

// Crawlers match their product token loosely, so a token like `facebook*` or
// `meta-external` also covers `facebookexternalhit` / `meta-externalfetcher`.
const covers = (token: string, agent: string) => {
  const t = token.replace(/\*+$/, "");
  return t !== "" && (agent.includes(t) || t.includes(agent));
};

// Returns every way `text` breaks the crawler policy; empty means it is sound.
function policyViolations(text: string): string[] {
  const { groups, sitemaps } = parseRobots(text);
  const violations: string[] = [];
  const named = (agent: string) => agent.toLowerCase();
  const blocked = new Set(BLOCKED.map(named));

  for (const agent of BLOCKED) {
    const isBlocked = groups.some(
      (g) =>
        g.agents.includes(named(agent)) &&
        g.rules.some((r) => r.type === "disallow" && r.value === "/") &&
        !g.rules.some((r) => r.type === "allow" && r.value === "/"),
    );
    if (!isBlocked) violations.push(`${agent} is not blocked from /`);
  }

  for (const agent of MUST_STAY_ALLOWED) {
    const restricted = groups.some(
      (g) => g.agents.some((t) => covers(t, named(agent))) && hasDisallow(g),
    );
    if (restricted) violations.push(`${agent} has a Disallow rule`);
  }

  const star = groups.filter((g) => g.agents.includes("*"));
  if (
    !star.some((g) =>
      g.rules.some((r) => r.type === "allow" && r.value === "/"),
    )
  )
    violations.push("* group does not allow /");
  if (star.some(hasDisallow)) violations.push("* group has a Disallow rule");

  for (const g of groups) {
    if (!hasDisallow(g)) continue;
    for (const a of g.agents)
      if (!blocked.has(a) && a !== "*")
        violations.push(`${a} has a Disallow but is not in the blocklist`);
  }

  if (!sitemaps.includes(SITEMAP)) violations.push("sitemap line missing");
  return violations;
}

const robotsText = readFileSync(
  resolve(process.cwd(), "public/robots.txt"),
  "utf8",
);
const { groups } = parseRobots(robotsText);
const groupsFor = (agent: string) =>
  groups.filter((g) => g.agents.includes(agent.toLowerCase()));

describe("public/robots.txt", () => {
  it("satisfies the crawler policy", () => {
    expect(policyViolations(robotsText)).toEqual([]);
  });

  it.each(BLOCKED)("has a group blocking %s", (agent) => {
    expect(groupsFor(agent).length).toBeGreaterThan(0);
  });
});

describe("policyViolations (guards against false passes)", () => {
  const withExtra = (extra: string) => `${robotsText}\n${extra}\n`;

  it.each([
    [
      "wildcard path Disallow on a protected bot",
      "User-agent: facebookexternalhit\nDisallow: /*",
    ],
    [
      "section Disallow on a protected bot",
      "User-agent: Googlebot\nDisallow: /about/",
    ],
    [
      "prefix-pattern group that covers a protected bot",
      "User-agent: facebook*\nDisallow: /",
    ],
    [
      "partial-token group that covers a protected bot",
      "User-agent: meta-external\nDisallow: /",
    ],
    [
      "query Disallow on a protected bot",
      "User-agent: PerplexityBot\nDisallow: /?",
    ],
    ["Disallow on an unlisted agent", "User-agent: SomeOtherBot\nDisallow: /"],
  ])("flags: %s", (_name, extra) => {
    expect(policyViolations(withExtra(extra)).length).toBeGreaterThan(0);
  });

  it("flags a Disallow added to the * group", () => {
    const text = robotsText.replace(
      "Allow: /\n",
      "Allow: /\nDisallow: /about/\n",
    );
    expect(text).not.toBe(robotsText);
    expect(policyViolations(text)).toContain("* group has a Disallow rule");
  });

  it("flags a blocked agent that also has Allow: /", () => {
    const text = robotsText.replace(
      "User-agent: GPTBot\nDisallow: /",
      "User-agent: GPTBot\nAllow: /\nDisallow: /",
    );
    expect(text).not.toBe(robotsText);
    expect(policyViolations(text)).toContain("GPTBot is not blocked from /");
  });

  it("flags a missing sitemap", () => {
    const text = robotsText.replace(/^Sitemap:.*$/m, "");
    expect(policyViolations(text)).toContain("sitemap line missing");
  });

  it("flags a missing blocked agent", () => {
    const text = robotsText.replace(/User-agent: CCBot\nDisallow: \/\n/, "");
    expect(text).not.toBe(robotsText);
    expect(policyViolations(text)).toContain("CCBot is not blocked from /");
  });
});
