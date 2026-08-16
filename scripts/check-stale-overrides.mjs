#!/usr/bin/env node
// Checks each `pnpm-workspace.yaml` override to see if it's still needed:
// removes one override at a time, reinstalls, and re-runs `pnpm audit`. If
// the audit stays clean without the override, the parent package has caught
// up to the patched version on its own and the pin is safe to delete.
//
// Prints a summary and, on GitHub Actions, appends `stale=<comma-list>` to
// $GITHUB_OUTPUT so the workflow can open an issue when something is stale.

import { execSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

const WORKSPACE_FILE = "pnpm-workspace.yaml";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function parseOverrides(text) {
  const lines = text.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === "overrides:");
  if (startIndex === -1) return [];

  const overrides = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("  ") || line.trim() === "") {
      const match = line.match(/^\s{2}([\w@/.-]+):\s*"([^"]+)"\s*$/);
      if (match) overrides.push({ name: match[1], range: match[2], line: i });
      continue;
    }
    break; // dedented to a new top-level key; overrides block is over
  }
  return overrides;
}

function withOverrideLineRemoved(text, lineIndex) {
  const lines = text.split("\n");
  lines.splice(lineIndex, 1);
  return lines.join("\n");
}

function auditFlags(pkgName) {
  let stdout;
  try {
    stdout = run("pnpm audit --json");
  } catch (err) {
    // pnpm audit exits non-zero when it finds vulnerabilities; stdout still has the report.
    stdout = err.stdout?.toString() ?? "{}";
  }
  const report = JSON.parse(stdout);
  const advisories = Object.values(report.advisories ?? {});
  return advisories.some((a) => a.module_name === pkgName);
}

const original = readFileSync(WORKSPACE_FILE, "utf8");
const overrides = parseOverrides(original);

if (overrides.length === 0) {
  console.log("No overrides configured in pnpm-workspace.yaml.");
  process.exit(0);
}

const stale = [];
const stillNeeded = [];

try {
  for (const { name, range, line } of overrides) {
    console.log(`Checking ${name} (${range})...`);
    writeFileSync(WORKSPACE_FILE, withOverrideLineRemoved(original, line));
    run("pnpm install --no-frozen-lockfile");

    if (auditFlags(name)) {
      console.log(`  still needed: ${name} is vulnerable without the override`);
      stillNeeded.push(name);
    } else {
      console.log(`  stale: ${name} is clean even without the override`);
      stale.push(name);
    }
  }
} finally {
  writeFileSync(WORKSPACE_FILE, original);
  run("pnpm install --no-frozen-lockfile");
}

console.log("");
if (stale.length > 0) {
  console.log(`Stale overrides (safe to remove): ${stale.join(", ")}`);
} else {
  console.log("All overrides are still necessary.");
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `stale=${stale.join(",")}\n`);
}
