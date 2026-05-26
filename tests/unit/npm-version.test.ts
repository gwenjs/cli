/**
 * Tests for `src/utils/npm-version.ts`
 *
 * Strategy:
 *   - Stub global `fetch` with `vi.stubGlobal` to control network responses.
 *   - Use a real temp directory for the disk cache (set via GWEN_NPM_VERSION_CACHE_PATH).
 *   - Set GWEN_NPM_VERSION_TTL_MS to control expiry without sleeping.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchStub(version: string, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue({ version }),
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

let tempDir: string;
let cachePath: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gwen-npm-version-test-"));
  cachePath = path.join(tempDir, "npm-versions.json");
  process.env["GWEN_NPM_VERSION_CACHE_PATH"] = cachePath;
  process.env["GWEN_NPM_VERSION_TTL_MS"] = "3600000";
});

afterEach(async () => {
  delete process.env["GWEN_NPM_VERSION_CACHE_PATH"];
  delete process.env["GWEN_NPM_VERSION_TTL_MS"];
  await fs.rm(tempDir, { recursive: true, force: true });
  vi.unstubAllGlobals();
  vi.resetModules();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("getLatestNpmVersion — cache miss (no cache file)", () => {
  it("fetches from npm registry and returns the version", async () => {
    vi.stubGlobal("fetch", makeFetchStub("1.2.3"));

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    const version = await getLatestNpmVersion("@gwenjs/core");

    expect(fetch).toHaveBeenCalledWith(
      "https://registry.npmjs.org/@gwenjs/core/latest",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(version).toBe("1.2.3");
  });

  it("writes the fetched version to the cache file", async () => {
    vi.stubGlobal("fetch", makeFetchStub("1.2.3"));

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    await getLatestNpmVersion("@gwenjs/core");

    const raw = await fs.readFile(cachePath, "utf8");
    const cache = JSON.parse(raw) as Record<string, { fetchedAt: number; version: string }>;
    expect(cache["@gwenjs/core"]).toMatchObject({ version: "1.2.3" });
    expect(cache["@gwenjs/core"]!.fetchedAt).toBeTypeOf("number");
  });

  it("caches multiple packages independently", async () => {
    const fetchStub = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ version: "1.0.0" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ version: "2.0.0" }) });
    vi.stubGlobal("fetch", fetchStub);

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    await getLatestNpmVersion("@gwenjs/core");
    await getLatestNpmVersion("@gwenjs/app");

    const raw = await fs.readFile(cachePath, "utf8");
    const cache = JSON.parse(raw) as Record<string, { fetchedAt: number; version: string }>;
    expect(cache["@gwenjs/core"]!.version).toBe("1.0.0");
    expect(cache["@gwenjs/app"]!.version).toBe("2.0.0");
  });
});

describe("getLatestNpmVersion — cache hit (fresh cache)", () => {
  it("returns cached version without calling fetch", async () => {
    const cacheEntry = {
      "@gwenjs/core": { fetchedAt: Date.now(), version: "0.9.0" },
    };
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(cacheEntry), "utf8");

    vi.stubGlobal("fetch", makeFetchStub("1.2.3"));

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    const version = await getLatestNpmVersion("@gwenjs/core");

    expect(fetch).not.toHaveBeenCalled();
    expect(version).toBe("0.9.0");
  });
});

describe("getLatestNpmVersion — cache expired", () => {
  it("re-fetches when the cached entry is older than TTL", async () => {
    process.env["GWEN_NPM_VERSION_TTL_MS"] = "1000";
    const staleEntry = {
      "@gwenjs/core": { fetchedAt: Date.now() - 5000, version: "0.1.0" },
    };
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(staleEntry), "utf8");

    vi.stubGlobal("fetch", makeFetchStub("1.2.3"));

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    const version = await getLatestNpmVersion("@gwenjs/core");

    expect(fetch).toHaveBeenCalledOnce();
    expect(version).toBe("1.2.3");
  });
});

describe("getLatestNpmVersion — fetch failure", () => {
  it("returns null when fetch throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    const version = await getLatestNpmVersion("@gwenjs/core");

    expect(version).toBeNull();
  });

  it("returns null when the npm registry returns a non-ok HTTP status", async () => {
    vi.stubGlobal("fetch", makeFetchStub("", false, 404));

    const { getLatestNpmVersion } = await import("../../src/utils/npm-version.js");
    const version = await getLatestNpmVersion("@gwenjs/core");

    expect(version).toBeNull();
  });
});
