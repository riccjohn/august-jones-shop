import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const isE2E = process.env.E2E_TEST === "true";

export default function nextConfig(phase: string): NextConfig {
  return {
    output: "export",
    // `next build` writes the static export into `out/`, which must stay
    // `out` for the Cloudflare Pages deploy and for the e2e webServer's
    // `serve out`. `next dev` writes its own manifests into `<distDir>/dev`
    // — nesting that inside `out/` meant an e2e run's build clobbered a
    // live dev server's build state. Keep dev on Next's own default instead.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next" : "out",
    reactCompiler: true,
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
    turbopack: isE2E
      ? {
          resolveAlias: {
            "@/data/event-source": "./src/data/event-source.e2e.ts",
          },
        }
      : {},
  };
}
