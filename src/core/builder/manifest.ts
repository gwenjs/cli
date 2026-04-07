/**
 * Manifest generation
 */

import fs from "node:fs/promises";
import { join } from "pathe";
import { logger } from "../../utils/logger.js";
import { VERSION } from "../../utils/constants.js";
import type { GwenOptions } from "@gwenjs/schema";
import type { BuildContext } from "./context.js";

interface ManifestPluginInput {
  name: string;
  packageName?: string;
  symbolName?: string;
  type?: "wasm" | "js";
  wasm?: {
    id?: string;
  };
}

interface Manifest {
  version: string;
  builtAt: string;
  engine: GwenOptions["engine"];
  plugins: Array<{
    name: string;
    type: "wasm" | "js";
    wasmPath?: string;
    jsPath?: string;
  }>;
}

/**
 * Derives a safe filesystem basename from a WASM plugin package ID.
 *
 * Handles the two common naming conventions:
 *   `@gwenjs/gwen-physics2d` → `physics2d`
 *   `@gwenjs/physics2d`      → `physics2d`
 *   `physics2d`              → `physics2d`
 *
 * @param id - The npm package ID declared in the plugin's `wasm.id` field.
 * @returns A basename safe to use in a `./wasm/<basename>_bg.wasm` path.
 */
function wasmBaseName(id: string): string {
  return id.replace("@gwenjs/gwen-", "").replace("@gwenjs/", "").split("/").at(-1) ?? id;
}

/**
 * Generate and write build manifest
 */
export async function generateManifest(ctx: BuildContext): Promise<void> {
  if (!ctx.config) throw new Error("Config not loaded");

  await fs.mkdir(ctx.outDir, { recursive: true });

  const manifest: Manifest = {
    version: VERSION,
    builtAt: new Date().toISOString(),
    engine: ctx.config.engine,
    plugins: [
      {
        name: "gwen_core",
        type: "wasm",
        wasmPath: "./wasm/gwen_core_bg.wasm",
        jsPath: "./wasm/gwen_core.js",
      },
      ...(ctx.config.plugins ?? []).map((plugin) => {
        const p = plugin as ManifestPluginInput;
        const isLegacy = "packageName" in p;
        const name = isLegacy ? (p.symbolName ?? p.name) : p.name;
        const type = isLegacy ? p.type : p.wasm ? "wasm" : "js";
        const pkgName = isLegacy ? p.packageName : p.wasm?.id || "";

        return {
          name,
          type: type as "wasm" | "js",
          ...(type === "wasm" && pkgName
            ? {
                wasmPath: `./wasm/${wasmBaseName(pkgName)}_bg.wasm`,
                jsPath: `./wasm/${wasmBaseName(pkgName)}.js`,
              }
            : {}),
        };
      }),
    ],
  };

  const manifestPath = join(ctx.outDir, "gwen-manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  logger.debug(`Manifest written → ${manifestPath}`);
}
