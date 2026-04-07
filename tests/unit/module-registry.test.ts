/**
 * Tests for `src/utils/module-registry.ts`
 *
 * Strategy:
 *   - Stub global `fetch` with `vi.stubGlobal` to control network responses.
 *   - Use a real temp directory for the disk cache (set via GWEN_REGISTRY_CACHE_PATH).
 *   - Set GWEN_REGISTRY_TTL_MS to control expiry without sleeping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRegistryPayload(overrides: Record<string, unknown> = {}) {
  return {
    version: "1",
    generatedAt: new Date().toISOString(),
    modules: [
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
      {
        name: "legacy-module",
        displayName: "Legacy",
        description: "Old module",
        npm: "@gwenjs/legacy",
        repo: "gwenjs/legacy",
        website: "",
        category: "Other",
        type: "official",
        deprecated: true,
        compatibility: { gwen: ">=0.1.0" },
      },
    ],
    ...overrides,
  };
}

function makeFetchStub(payload: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

let tempDir: string;
let cachePath: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gwen-registry-test-"));
  cachePath = path.join(tempDir, "modules.json");
  process.env["GWEN_REGISTRY_CACHE_PATH"] = cachePath;
  process.env["GWEN_REGISTRY_TTL_MS"] = "3600000"; // 1 hour default
});

afterEach(async () => {
  delete process.env["GWEN_REGISTRY_CACHE_PATH"];
  delete process.env["GWEN_REGISTRY_TTL_MS"];
  await fs.rm(tempDir, { recursive: true, force: true });
  vi.unstubAllGlobals();
  vi.resetModules();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getModules — cache miss (no cache file)", () => {
  it("fetches from remote and returns non-deprecated modules", async () => {
    const payload = makeRegistryPayload();
    vi.stubGlobal("fetch", makeFetchStub(payload));

    const { getModules } = await import("../../src/utils/module-registry.js");
    const modules = await getModules();

    expect(fetch).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/gwenjs/modules/main/registry.json",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(modules).toHaveLength(1);
    expect(modules[0]!.name).toBe("physics2d");
  });

  it("writes the fetched registry to the cache file", async () => {
    const payload = makeRegistryPayload();
    vi.stubGlobal("fetch", makeFetchStub(payload));

    const { getModules } = await import("../../src/utils/module-registry.js");
    await getModules();

    const raw = await fs.readFile(cachePath, "utf8");
    const cached = JSON.parse(raw) as { fetchedAt: number; data: unknown };
    expect(cached.fetchedAt).toBeTypeOf("number");
    expect(cached.data).toMatchObject({ version: "1" });
  });
});

describe("getModules — cache hit (fresh cache)", () => {
  it("returns cached modules without calling fetch", async () => {
    const payload = makeRegistryPayload();
    const cacheEntry = { fetchedAt: Date.now(), data: payload };
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cacheEntry), "utf8");

    vi.stubGlobal("fetch", makeFetchStub(payload));

    const { getModules } = await import("../../src/utils/module-registry.js");
    await getModules();

    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns only non-deprecated modules from cache", async () => {
    const payload = makeRegistryPayload();
    const cacheEntry = { fetchedAt: Date.now(), data: payload };
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cacheEntry), "utf8");

    vi.stubGlobal("fetch", makeFetchStub(payload));

    const { getModules } = await import("../../src/utils/module-registry.js");
    const modules = await getModules();

    expect(modules.every((m) => !m.deprecated)).toBe(true);
    expect(modules.some((m) => m.name === "legacy-module")).toBe(false);
  });
});

describe("getModules — cache expired", () => {
  it("re-fetches when cache is older than TTL", async () => {
    process.env["GWEN_REGISTRY_TTL_MS"] = "1000"; // 1 second TTL
    const payload = makeRegistryPayload();
    const expired = { fetchedAt: Date.now() - 5000, data: payload }; // 5s ago
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(expired), "utf8");

    vi.stubGlobal("fetch", makeFetchStub(payload));

    const { getModules } = await import("../../src/utils/module-registry.js");
    await getModules();

    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe("getModules — fetch failure", () => {
  it("returns fallback modules when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { getModules } = await import("../../src/utils/module-registry.js");
    const modules = await getModules();

    // Fallback has 5 non-deprecated official modules
    expect(modules.length).toBeGreaterThan(0);
    expect(modules.every((m) => !m.deprecated)).toBe(true);
  });

  it("returns fallback modules when fetch returns non-ok HTTP status", async () => {
    vi.stubGlobal("fetch", makeFetchStub(null, false, 404));

    const { getModules } = await import("../../src/utils/module-registry.js");
    const modules = await getModules();

    expect(modules.length).toBeGreaterThan(0);
  });
});

describe("getModules — deprecated filter", () => {
  it("excludes deprecated modules regardless of source", async () => {
    const payload = makeRegistryPayload();
    vi.stubGlobal("fetch", makeFetchStub(payload));

    const { getModules } = await import("../../src/utils/module-registry.js");
    const modules = await getModules();

    expect(modules.some((m) => m.deprecated)).toBe(false);
  });
});
