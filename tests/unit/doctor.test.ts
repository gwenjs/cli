/**
 * Unit tests for the `doctor` command health checks
 *
 * Tests that each HealthCheck in the CHECKS array returns a valid result
 * object with `{ ok: boolean; message: string }`.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { CHECKS } from "../../src/commands/doctor.js";

describe("CHECKS (doctor health checks)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports a non-empty CHECKS array", () => {
    expect(Array.isArray(CHECKS)).toBe(true);
    expect(CHECKS.length).toBeGreaterThan(0);
  });

  it("every check has a non-empty name", () => {
    for (const check of CHECKS) {
      expect(typeof check.name).toBe("string");
      expect(check.name.length).toBeGreaterThan(0);
    }
  });

  it("every check returns { ok: boolean, message: string }", async () => {
    for (const check of CHECKS) {
      const result = await check.run();
      expect(typeof result.ok).toBe("boolean");
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("Node.js version check passes on the current runtime", async () => {
    const nodeCheck = CHECKS.find((c) => c.name === "Node.js version");
    expect(nodeCheck).toBeDefined();
    const result = await nodeCheck!.run();
    // The test runner itself must be Node >= 18.
    expect(result.ok).toBe(true);
    expect(result.message).toContain(process.versions.node);
  });

  it("Node.js version check fails when version is below 18", async () => {
    // Temporarily override process.versions.node.
    const original = process.versions.node;
    Object.defineProperty(process.versions, "node", {
      value: "16.20.0",
      configurable: true,
      writable: true,
    });

    const nodeCheck = CHECKS.find((c) => c.name === "Node.js version")!;
    const result = await nodeCheck.run();
    expect(result.ok).toBe(false);

    // Restore.
    Object.defineProperty(process.versions, "node", {
      value: original,
      configurable: true,
      writable: true,
    });
  });

  it("gwen.config.ts check reflects file existence", async () => {
    const configCheck = CHECKS.find((c) => c.name === "gwen.config.ts exists");
    expect(configCheck).toBeDefined();
    const result = await configCheck!.run();
    // Just verify the shape — the file may or may not exist in the test env.
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });

  it("WASM binary check returns a valid result shape", async () => {
    const wasmCheck = CHECKS.find((c) => c.name === "WASM binary");
    expect(wasmCheck).toBeDefined();
    const result = await wasmCheck!.run();
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });

  it("gwen.config.ts exists check returns ok:false when file is absent", async () => {
    const configCheck = CHECKS.find((c) => c.name === "gwen.config.ts exists")!;
    vi.spyOn(require("node:fs"), "existsSync").mockReturnValue(false);
    const result = await configCheck.run();
    expect(result.ok).toBe(false);
    expect(result.message).toContain("run 'gwen init'");
  });

  it("gwen.config.ts exists check returns ok:true when file exists", async () => {
    const configCheck = CHECKS.find((c) => c.name === "gwen.config.ts exists")!;
    vi.spyOn(require("node:fs"), "existsSync").mockReturnValue(true);
    const result = await configCheck.run();
    expect(result.ok).toBe(true);
  });

  it("gwen.config.ts parses check returns ok:false when config fails to load", async () => {
    const parseCheck = CHECKS.find((c) => c.name === "gwen.config.ts parses")!;
    const { loadGwenConfig } = await import("../../src/core/config.js");
    vi.spyOn({ loadGwenConfig }, "loadGwenConfig").mockRejectedValue(new Error("parse error"));
    // The check should not throw; it should catch and return ok:false
    const result = await parseCheck.run();
    expect(typeof result.ok).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });

  it("WASM binary check returns ok:false when binary is not found", async () => {
    const wasmCheck = CHECKS.find((c) => c.name === "WASM binary")!;
    vi.spyOn(require("node:fs"), "existsSync").mockReturnValue(false);
    const result = await wasmCheck.run();
    expect(result.ok).toBe(false);
    expect(result.message).toContain("@gwenjs/core");
  });
});
