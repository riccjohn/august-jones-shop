import path from "node:path";
import type { NextConfig } from "next";

const isE2E = process.env.E2E_TEST === "true";

const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  webpack(config) {
    if (isE2E) {
      config.resolve.alias["@/data/event-source"] = path.resolve(
        __dirname,
        "src/data/event-source.e2e.ts",
      );
    }
    return config;
  },
};

export default nextConfig;
