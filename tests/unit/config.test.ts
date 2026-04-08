/**
 * Unit tests for config loading utilities.
 */

import { describe, it, expect, vi } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

const mockLoadConfig = vi.fn();
const mockLoadRawGwenConfig = vi.fn();

vi.mock("c12", () => ({ loadConfig: mockLoadConfig }));

vi.mock("@gwenjs/app/resolve", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@gwenjs/app/resolve")>();
  return {
    ...actual,
    loadRawGwenConfig: mockLoadRawGwenConfig,
  };
});

describe("findConfigFile", () => {
  it("returns null when no config file exists in the directory", async () => {
    mockLoadConfig.mockResolvedValueOnce({ configFile: undefined, config: {} });
    const { findConfigFile } = await import("../../src/core/config.js");
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gwen-config-test-"));
    try {
      const result = await findConfigFile(tmpDir);
      expect(result).toBeNull();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns null when loadConfig throws", async () => {
    mockLoadConfig.mockRejectedValueOnce(new Error("c12 failure"));
    const { findConfigFile } = await import("../../src/core/config.js");
    const result = await findConfigFile("/some/dir");
    expect(result).toBeNull();
  });

  it("returns configFile path when found", async () => {
    mockLoadConfig.mockResolvedValueOnce({ configFile: "/project/gwen.config.ts", config: {} });
    const { findConfigFile } = await import("../../src/core/config.js");
    const result = await findConfigFile("/project");
    expect(result).toBe("/project/gwen.config.ts");
  });
});

describe("loadGwenConfig", () => {
  it("throws a descriptive error when GwenConfigLoadError is raised", async () => {
    const { GwenConfigLoadError } = await import("@gwenjs/app/resolve");
    mockLoadRawGwenConfig.mockRejectedValueOnce(new GwenConfigLoadError("not found"));
    const { loadGwenConfig } = await import("../../src/core/config.js");
    await expect(loadGwenConfig("/nonexistent/path")).rejects.toThrow("Config file not found");
  });

  it("re-throws non-GwenConfigLoadError errors", async () => {
    mockLoadRawGwenConfig.mockRejectedValueOnce(new Error("unexpected failure"));
    const { loadGwenConfig } = await import("../../src/core/config.js");
    await expect(loadGwenConfig("/some/path")).rejects.toThrow("unexpected failure");
  });
});
