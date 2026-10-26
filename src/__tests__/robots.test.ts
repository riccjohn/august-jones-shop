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

const robotsText = readFileSync(
  resolve(process.cwd(), "public/robots.txt"),
  "utf8",
);
const { groups, sitemaps } = parseRobots(robotsText);

const disallowsRoot = (g: Group) =>
  g.rules.some((r) => r.type === "disallow" && r.value === "/");
const groupsFor = (agent: string) =>
  groups.filter((g) => g.agents.includes(agent.toLowerCase()));
const isBlocked = (agent: string) => groupsFor(agent).some(disallowsRoot);

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

describe("public/robots.txt", () => {
  it.each(BLOCKED)("blocks %s from the whole site", (agent) => {
    expect(isBlocked(agent)).toBe(true);
  });

  it("still allows everything for the * group", () => {
    const star = groupsFor("*");
    expect(star.length).toBeGreaterThan(0);
    expect(
      star.some((g) =>
        g.rules.some((r) => r.type === "allow" && r.value === "/"),
      ),
    ).toBe(true);
    expect(star.some(disallowsRoot)).toBe(false);
  });

  it("keeps the sitemap line", () => {
    expect(sitemaps).toContain("https://www.augustjones.shop/sitemap.xml");
  });

  it.each(MUST_STAY_ALLOWED)("does not block %s", (agent) => {
    expect(isBlocked(agent)).toBe(false);
  });

  it("only disallows / for agents in the explicit blocklist", () => {
    const allowedBlocked = new Set(BLOCKED.map((a) => a.toLowerCase()));
    const offenders = groups
      .filter(disallowsRoot)
      .flatMap((g) => g.agents)
      .filter((a) => !allowedBlocked.has(a));
    expect(offenders).toEqual([]);
  });
});
