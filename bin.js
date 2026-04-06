#!/usr/bin/env node
/**
 * GWEN CLI — bin wrapper
 *
 * Uses jiti to run src/bin.ts directly without a compilation step in dev.
 * In production, dist/bin.js is used.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { createRequire, register } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Register jiti as a Node module loader hook
const __require = createRequire(import.meta.url);
const jitiDir = path.dirname(__require.resolve("jiti/package.json"));
const jitiHooksUrl = new URL(`file://${path.join(jitiDir, "lib", "jiti-register.mjs")}`);
register(jitiHooksUrl, import.meta.url);

// Production: use compiled dist/bin.js
const distBin = path.join(__dirname, "dist", "bin.js");
if (!process.env.GWEN_CLI_FORCE_JITI && fs.existsSync(distBin)) {
  await import(distBin);
} else {
  // Dev or GWEN_CLI_FORCE_JITI=1: run src/bin.ts via jiti
  const { createJiti } = await import("jiti");
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  await jiti.import(path.join(__dirname, "src", "bin.ts"));
}
