/**
 * Unit tests for `appendModuleToConfig`
 *
 * Tests the config-writer utility that appends module entries to gwen.config.ts.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { vi } from "vitest";
import { appendModuleToConfig } from "../../dist/packages/cli/src/utils/config-writer.js";
import { addCommand } from "../../src/commands/add.js";
import { logger } from "../../src/utils/logger.js";

vi.mock("../../src/utils/module-registry.js", () => ({
  getModules: vi.fn().mockResolvedValue([
    {
      name: "physics2d",
      displayName: "Physics 2D",
      description: "Rapier-based 2D physics engine",
      npm: "@gwenjs/physics2d",
      repo: "gwenjs/physics2d",
      website: "",
      category: "Physics",
      type: "official",
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
  ]),
}));

vi.mock("../../src/utils/package-manager.js", () => ({
  runInstall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/utils/config-writer.js", () => ({
  appendModuleToConfig: vi.fn().mockResolvedValue(undefined),
}));

/** Creates an isolated temp directory for each test. */
async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "gwen-test-"));
}

describe("appendModuleToConfig", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("appends a module to an empty modules array", async () => {
    const configPath = path.join(tmpDir, "gwen.config.ts");
    await fs.writeFile(
      configPath,
      `import { defineConfig } from '@gwenjs/app'\nexport default defineConfig({ modules: [] })\n`,
      "utf8",
    );

    await appendModuleToConfig("@gwenjs/physics", { configPath });

    const content = await fs.readFile(configPath, "utf8");
    expect(content).toContain("@gwenjs/physics");
    expect(content).toContain("modules:");
  });

  it("does not duplicate a module already registered", async () => {
    const configPath = path.join(tmpDir, "gwen.config.ts");
    await fs.writeFile(
      configPath,
      `import { defineConfig } from '@gwenjs/app'\nexport default defineConfig({ modules: ['@gwenjs/physics'] })\n`,
      "utf8",
    );

    await appendModuleToConfig("@gwenjs/physics", { configPath });

    const content = await fs.readFile(configPath, "utf8");
    // Should appear exactly once.
    const occurrences = content.split("@gwenjs/physics").length - 1;
    expect(occurrences).toBe(1);
  });

  it("throws when the config file does not exist", async () => {
    const configPath = path.join(tmpDir, "nonexistent.ts");
    await expect(appendModuleToConfig("@gwenjs/audio", { configPath })).rejects.toThrow(
      "[GWEN:ConfigWriter]",
    );
  });

  it("throws when the modules array marker is missing", async () => {
    const configPath = path.join(tmpDir, "gwen.config.ts");
    await fs.writeFile(configPath, `export default {}\n`, "utf8");

    await expect(appendModuleToConfig("@gwenjs/audio", { configPath })).rejects.toThrow(
      "[GWEN:ConfigWriter]",
    );
  });

  it("appends multiple different modules independently", async () => {
    const configPath = path.join(tmpDir, "gwen.config.ts");
    await fs.writeFile(
      configPath,
      `import { defineConfig } from '@gwenjs/app'\nexport default defineConfig({ modules: [] })\n`,
      "utf8",
    );

    await appendModuleToConfig("@gwenjs/physics", { configPath });
    await appendModuleToConfig("@gwenjs/audio", { configPath });

    const content = await fs.readFile(configPath, "utf8");
    expect(content).toContain("@gwenjs/physics");
    expect(content).toContain("@gwenjs/audio");
  });
});

describe("addCommand — registry validation", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("does not warn when the module is listed in the registry", async () => {
    await addCommand.run({
      args: { module: "@gwenjs/physics2d", dev: false },
      cmd: addCommand,
      rawArgs: [],
    });

    const warnCalls = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(warnCalls.some((msg) => msg.includes("not in the GWEN module registry"))).toBe(false);
  });

  it("warns when the module is not found in the registry", async () => {
    await addCommand.run({
      args: { module: "@gwenjs/unknown-pkg", dev: false },
      cmd: addCommand,
      rawArgs: [],
    });

    const warnCalls = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(warnCalls.some((msg) => msg.includes("not in the GWEN module registry"))).toBe(true);
  });

  it("still installs the module even when not in registry", async () => {
    const { runInstall } = await import("../../src/utils/package-manager.js");

    await addCommand.run({
      args: { module: "@gwenjs/unknown-pkg", dev: false },
      cmd: addCommand,
      rawArgs: [],
    });

    expect(runInstall).toHaveBeenCalledWith(["@gwenjs/unknown-pkg"], { dev: false });
  });
});
