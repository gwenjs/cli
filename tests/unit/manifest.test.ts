/**
 * Unit tests for manifest generation.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { generateManifest } from "../../src/core/builder/manifest.js";
import { createBuildContext } from "../../src/core/builder/context.js";
import type { BuildContext } from "../../src/core/builder/context.js";

const BASE_CONFIG = {
  engine: { maxEntities: 1000, targetFPS: 60 },
  modules: [],
  plugins: [],
  rootDir: "/tmp/fake",
  dev: false,
} as const;

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "gwen-manifest-test-"));
}

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await makeTempDir();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function makeCtx(overrides: Partial<BuildContext> = {}): BuildContext {
  return {
    ...createBuildContext(tmpDir, tmpDir, "release", false),
    config: { ...BASE_CONFIG },
    ...overrides,
  };
}

describe("generateManifest", () => {
  it("throws when config is not loaded", async () => {
    const ctx = makeCtx({ config: undefined });
    await expect(generateManifest(ctx)).rejects.toThrow("Config not loaded");
  });

  it("writes gwen-manifest.json to outDir", async () => {
    const ctx = makeCtx();
    await generateManifest(ctx);
    const manifestPath = path.join(tmpDir, "gwen-manifest.json");
    const exists = await fs
      .access(manifestPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("manifest contains version, builtAt, engine and gwen_core plugin", async () => {
    const ctx = makeCtx();
    await generateManifest(ctx);
    const raw = await fs.readFile(path.join(tmpDir, "gwen-manifest.json"), "utf8");
    const manifest = JSON.parse(raw) as Record<string, unknown>;
    expect(manifest.version).toBeTypeOf("string");
    expect(manifest.builtAt).toBeTypeOf("string");
    expect(manifest.engine).toEqual(BASE_CONFIG.engine);
    const plugins = manifest.plugins as Array<Record<string, unknown>>;
    expect(plugins[0]).toMatchObject({ name: "gwen_core", type: "wasm" });
  });

  it("includes a WASM plugin with correct wasmPath derived from package name", async () => {
    const ctx = makeCtx({
      config: {
        ...BASE_CONFIG,
        plugins: [{ name: "physics2d", wasm: { id: "@gwenjs/physics2d" } } as never],
      },
    });
    await generateManifest(ctx);
    const raw = await fs.readFile(path.join(tmpDir, "gwen-manifest.json"), "utf8");
    const manifest = JSON.parse(raw) as Record<string, unknown>;
    const plugins = manifest.plugins as Array<Record<string, unknown>>;
    const physics = plugins.find((p) => p.name === "physics2d");
    expect(physics).toBeDefined();
    expect(physics?.type).toBe("wasm");
    expect(physics?.wasmPath).toBe("./wasm/physics2d_bg.wasm");
    expect(physics?.jsPath).toBe("./wasm/physics2d.js");
  });

  it("handles @gwenjs/gwen-* package name prefix correctly", async () => {
    const ctx = makeCtx({
      config: {
        ...BASE_CONFIG,
        plugins: [{ name: "physics2d", wasm: { id: "@gwenjs/gwen-physics2d" } } as never],
      },
    });
    await generateManifest(ctx);
    const raw = await fs.readFile(path.join(tmpDir, "gwen-manifest.json"), "utf8");
    const manifest = JSON.parse(raw) as Record<string, unknown>;
    const plugins = manifest.plugins as Array<Record<string, unknown>>;
    const physics = plugins.find((p) => p.name === "physics2d");
    expect(physics?.wasmPath).toBe("./wasm/physics2d_bg.wasm");
  });

  it("includes a JS plugin without wasm paths", async () => {
    const ctx = makeCtx({
      config: {
        ...BASE_CONFIG,
        plugins: [{ name: "my-js-plugin" } as never],
      },
    });
    await generateManifest(ctx);
    const raw = await fs.readFile(path.join(tmpDir, "gwen-manifest.json"), "utf8");
    const manifest = JSON.parse(raw) as Record<string, unknown>;
    const plugins = manifest.plugins as Array<Record<string, unknown>>;
    const jsPlugin = plugins.find((p) => p.name === "my-js-plugin");
    expect(jsPlugin).toBeDefined();
    expect(jsPlugin?.type).toBe("js");
    expect(jsPlugin?.wasmPath).toBeUndefined();
  });

  it("creates outDir if it does not exist", async () => {
    const nestedOut = path.join(tmpDir, "dist", "nested");
    const ctx = makeCtx({ outDir: nestedOut });
    await generateManifest(ctx);
    const exists = await fs
      .access(path.join(nestedOut, "gwen-manifest.json"))
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });
});
