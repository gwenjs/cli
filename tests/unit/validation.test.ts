/**
 * Unit tests for validation schemas
 * Tests Zod validation with various inputs
 */

import { describe, it, expect } from "vitest";
import { resolveConfig, validateResolvedConfig } from "@gwenjs/schema";
import type { GwenConfigInput, GwenPluginBase, GwenOptions } from "@gwenjs/schema";
import { isValidName } from "../../src/utils/validation.js";
import { parsePort } from "../../src/utils/args.js";

describe("CLI config validation via @gwenjs/schema", () => {
  it("applies defaults for empty input", () => {
    const conf = resolveConfig({});
    expect(conf.engine.maxEntities).toBe(5000);
    expect(conf.engine.targetFPS).toBe(60);
    expect(conf.html.title).toBe("GWEN Project");
    expect(conf.plugins).toEqual([]);
  });

  it("merges legacy tsPlugins/wasmPlugins into plugins", () => {
    const tsPlugin: GwenPluginBase = { name: "ts-plugin" };
    const wasmPlugin: GwenPluginBase = { name: "wasm-plugin", wasm: { id: "w" } };
    const input: GwenConfigInput = { tsPlugins: [tsPlugin], wasmPlugins: [wasmPlugin] };
    const conf = resolveConfig(input);

    expect(conf.plugins).toHaveLength(2);
    expect(conf.plugins).toContain(tsPlugin);
    expect(conf.plugins).toContain(wasmPlugin);
  });

  it("rejects invalid maxEntities with stable message", () => {
    expect(() => resolveConfig({ engine: { maxEntities: 50 } })).toThrow(
      "maxEntities must be between 100 and 1000000",
    );
  });

  it("rejects invalid targetFPS with stable message", () => {
    expect(() => resolveConfig({ engine: { targetFPS: 300 } })).toThrow(
      "targetFPS must be between 30 and 240",
    );
  });

  it("rejects invalid background with stable message", () => {
    const invalid = {
      ...resolveConfig({}),
      html: { title: "GWEN Project", background: "#gggggg" },
    } as unknown as GwenOptions;
    expect(() => validateResolvedConfig(invalid)).toThrow("background must be a valid hex color");
  });
});

describe("isValidName", () => {
  it("accepts simple kebab-case names", () => {
    expect(isValidName("my-game")).toBe(true);
    expect(isValidName("my-plugin")).toBe(true);
    expect(isValidName("my-module-v2")).toBe(true);
  });

  it("accepts names starting with digits", () => {
    expect(isValidName("game2d")).toBe(true);
    expect(isValidName("3d-engine")).toBe(true);
  });

  it("rejects path separators", () => {
    expect(isValidName("../evil")).toBe(false);
    expect(isValidName("foo/bar")).toBe(false);
    expect(isValidName("foo\\bar")).toBe(false);
  });

  it("rejects double-dot sequences", () => {
    expect(isValidName("..")).toBe(false);
    expect(isValidName("../../etc/passwd")).toBe(false);
  });

  it("rejects empty or whitespace-only names", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("   ")).toBe(false);
  });

  it("rejects names with uppercase letters", () => {
    expect(isValidName("MyGame")).toBe(false);
  });
});

describe("parsePort", () => {
  it("parses valid port numbers", () => {
    expect(parsePort(3000)).toBe(3000);
    expect(parsePort("8080")).toBe(8080);
    expect(parsePort(65535)).toBe(65535);
    expect(parsePort(1024)).toBe(1024);
  });

  it("throws for ports below 1024", () => {
    expect(() => parsePort(80)).toThrow("Port must be between 1024 and 65535");
    expect(() => parsePort(0)).toThrow();
  });

  it("throws for ports above 65535", () => {
    expect(() => parsePort(65536)).toThrow("Port must be between 1024 and 65535");
  });

  it("throws for non-integer values", () => {
    expect(() => parsePort(3000.5)).toThrow();
    expect(() => parsePort("abc")).toThrow();
  });
});
