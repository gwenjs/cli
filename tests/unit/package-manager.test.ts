/**
 * Unit tests for `detectPackageManager`
 *
 * Tests that the utility correctly identifies the package manager from lock files.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { detectPackageManager } from "../../src/utils/package-manager.js";

/** Creates an isolated temp directory for each test. */
async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "gwen-pm-test-"));
}

describe("detectPackageManager", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("detects pnpm when pnpm-lock.yaml is present", async () => {
    await fs.writeFile(path.join(tmpDir, "pnpm-lock.yaml"), "", "utf8");
    expect(detectPackageManager(tmpDir)).toBe("pnpm");
  });

  it("detects yarn when yarn.lock is present", async () => {
    await fs.writeFile(path.join(tmpDir, "yarn.lock"), "", "utf8");
    expect(detectPackageManager(tmpDir)).toBe("yarn");
  });

  it("detects bun when bun.lockb is present", async () => {
    await fs.writeFile(path.join(tmpDir, "bun.lockb"), "", "utf8");
    expect(detectPackageManager(tmpDir)).toBe("bun");
  });

  it("detects bun when bun.lock (Bun 1.1+ text format) is present", async () => {
    await fs.writeFile(path.join(tmpDir, "bun.lock"), "", "utf8");
    expect(detectPackageManager(tmpDir)).toBe("bun");
  });

  it("falls back to npm when no lock file is present", async () => {
    expect(detectPackageManager(tmpDir)).toBe("npm");
  });

  it("returns a known PackageManager string", async () => {
    const valid = ["pnpm", "npm", "yarn", "bun"];
    const result = detectPackageManager(tmpDir);
    expect(valid).toContain(result);
  });

  it("prefers pnpm over yarn when both lock files exist", async () => {
    await fs.writeFile(path.join(tmpDir, "pnpm-lock.yaml"), "", "utf8");
    await fs.writeFile(path.join(tmpDir, "yarn.lock"), "", "utf8");
    expect(detectPackageManager(tmpDir)).toBe("pnpm");
  });
});

describe("runInstall", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gwen-pm-install-test-"));
    vi.resetModules();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    vi.resetModules();
  });

  it("calls pnpm add with packages (no dev flag)", async () => {
    await fs.writeFile(path.join(tmpDir, "pnpm-lock.yaml"), "", "utf8");
    const execaMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("execa", () => ({ execa: execaMock }));
    const { runInstall } = await import("../../src/utils/package-manager.js");
    await runInstall(["@gwenjs/physics2d"], { cwd: tmpDir });
    expect(execaMock).toHaveBeenCalledWith(
      "pnpm",
      ["add", "@gwenjs/physics2d"],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it("appends --save-dev for pnpm when dev=true", async () => {
    await fs.writeFile(path.join(tmpDir, "pnpm-lock.yaml"), "", "utf8");
    const execaMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("execa", () => ({ execa: execaMock }));
    const { runInstall } = await import("../../src/utils/package-manager.js");
    await runInstall(["@gwenjs/physics2d"], { dev: true, cwd: tmpDir });
    expect(execaMock).toHaveBeenCalledWith(
      "pnpm",
      ["add", "@gwenjs/physics2d", "--save-dev"],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it("calls npm install with packages (no dev flag)", async () => {
    const execaMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("execa", () => ({ execa: execaMock }));
    const { runInstall } = await import("../../src/utils/package-manager.js");
    await runInstall(["some-pkg"], { cwd: tmpDir });
    expect(execaMock).toHaveBeenCalledWith(
      "npm",
      ["install", "some-pkg"],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it("calls yarn add --dev when dev=true", async () => {
    await fs.writeFile(path.join(tmpDir, "yarn.lock"), "", "utf8");
    const execaMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("execa", () => ({ execa: execaMock }));
    const { runInstall } = await import("../../src/utils/package-manager.js");
    await runInstall(["some-pkg"], { dev: true, cwd: tmpDir });
    expect(execaMock).toHaveBeenCalledWith(
      "yarn",
      ["add", "some-pkg", "--dev"],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it("calls bun add --dev when dev=true", async () => {
    await fs.writeFile(path.join(tmpDir, "bun.lockb"), "", "utf8");
    const execaMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("execa", () => ({ execa: execaMock }));
    const { runInstall } = await import("../../src/utils/package-manager.js");
    await runInstall(["some-pkg"], { dev: true, cwd: tmpDir });
    expect(execaMock).toHaveBeenCalledWith(
      "bun",
      ["add", "some-pkg", "--dev"],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });

  it("supports multiple packages in a single call", async () => {
    await fs.writeFile(path.join(tmpDir, "pnpm-lock.yaml"), "", "utf8");
    const execaMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("execa", () => ({ execa: execaMock }));
    const { runInstall } = await import("../../src/utils/package-manager.js");
    await runInstall(["pkg-a", "pkg-b"], { cwd: tmpDir });
    expect(execaMock).toHaveBeenCalledWith(
      "pnpm",
      ["add", "pkg-a", "pkg-b"],
      expect.objectContaining({ cwd: tmpDir }),
    );
  });
});
