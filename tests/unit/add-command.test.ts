/**
 * Unit tests for the `add` command — registry validation and install behaviour.
 *
 * Tests that addCommand validates modules against the registry and delegates
 * install/config-write to the correct utilities (mocked here).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { vi } from "vitest";
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
