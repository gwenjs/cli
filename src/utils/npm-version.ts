/**
 * npm registry version client.
 *
 * Fetches the latest published version of an npm package with a 24-hour disk
 * cache. Returns `null` when the network is unavailable so callers can fall
 * back gracefully.
 *
 * @module npm-version
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  fetchedAt: number;
  version: string;
}

type CacheFile = Record<string, CacheEntry>;

// ─── Env-driven helpers (overridable in tests) ────────────────────────────────

function getCachePath(): string {
  return (
    process.env["GWEN_NPM_VERSION_CACHE_PATH"] ??
    path.join(os.homedir(), ".cache", "gwen", "npm-versions.json")
  );
}

function getTtlMs(): number {
  const raw = process.env["GWEN_NPM_VERSION_TTL_MS"];
  return raw !== undefined ? Number(raw) : 24 * 60 * 60 * 1000;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function readCache(): Promise<CacheFile> {
  try {
    const raw = await fs.readFile(getCachePath(), "utf8");
    return JSON.parse(raw) as CacheFile;
  } catch {
    return {};
  }
}

async function writeCache(cache: CacheFile): Promise<void> {
  const p = getCachePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(cache), "utf8");
}

function isFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < getTtlMs();
}

// ─── Network ──────────────────────────────────────────────────────────────────

async function fetchVersion(packageName: string): Promise<string> {
  const url = `https://registry.npmjs.org/${packageName}/latest`;
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`npm registry returned HTTP ${res.status}`);
  const data = (await res.json()) as { version: string };
  return data.version;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return the latest published version of an npm package.
 *
 * Resolution order:
 * 1. Fresh disk cache (< TTL) — returned immediately.
 * 2. npm registry fetch — result written to cache.
 * 3. Returns `null` on any network or HTTP failure.
 *
 * @param packageName - The full npm package name (e.g. `"@gwenjs/core"`).
 * @returns The semver version string, or `null` if unavailable.
 */
export async function getLatestNpmVersion(packageName: string): Promise<string | null> {
  const cache = await readCache();
  const entry = cache[packageName];

  if (entry && isFresh(entry)) {
    return entry.version;
  }

  try {
    const version = await fetchVersion(packageName);
    cache[packageName] = { fetchedAt: Date.now(), version };
    await writeCache(cache);
    return version;
  } catch {
    return null;
  }
}
