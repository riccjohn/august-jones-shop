// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `API_VERSION` is declared twice — once in relay/src/graphql.ts (relay mode)
 * and once in functions/api/_lib/shopify.ts (the direct-call rollback path).
 * They cannot share an import: the two live in separate tsconfig projects,
 * one compiled to CommonJS for Node and one type-checked against
 * @cloudflare/workers-types.
 *
 * Until now the only thing holding them together was a comment in each file
 * saying they must match. Letting them drift would mean unsetting
 * SHOPIFY_RELAY_URL silently changes which Shopify API version the app talks
 * to — a rollback that quietly alters behavior is worse than no rollback.
 * This test is what actually enforces it.
 *
 * Both files are read as text rather than imported, because importing
 * shopify.ts from a Node-environment test would pull in Workers globals.
 */
function readApiVersion(relativePath: string): string {
  const absolute = join(process.cwd(), relativePath);
  const source = readFileSync(absolute, "utf8");
  const match = source.match(/^const API_VERSION = "([^"]+)";$/m);
  if (!match) {
    throw new Error(
      `Could not find a top-level \`const API_VERSION = "..."\` in ${relativePath}. ` +
        "If it was renamed or moved, update this test — do not delete it.",
    );
  }
  return match[1];
}

describe("Shopify API_VERSION", () => {
  it("is identical in the relay and the direct-call client", () => {
    const relayVersion = readApiVersion("relay/src/graphql.ts");
    const clientVersion = readApiVersion("functions/api/_lib/shopify.ts");

    expect(clientVersion).toBe(relayVersion);
  });

  it("looks like a Shopify calendar version (YYYY-MM)", () => {
    expect(readApiVersion("relay/src/graphql.ts")).toMatch(/^\d{4}-\d{2}$/);
  });
});
