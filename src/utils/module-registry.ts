/**
 * GWEN module registry client.
 *
 * Fetches the list of available GWEN modules from the remote registry
 * (gwenjs/modules on GitHub) with a 1-hour disk cache. Falls back to a
 * bundled offline copy when the network is unavailable.
 *
 * @module module-registry
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fallbackRegistry } from "../data/modules-registry.js";
import { logger } from "./logger.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single module entry in the GWEN registry. */
export interface GwenModule {
  /** Short kebab-case identifier (used as `value` in CLI prompts). */
  name: string;
  /** Human-readable name (used as `label` in CLI prompts). */
  displayName: string;
  /** One-line description of the module. */
  description: string;
  /** NPM package name (used as `hint` in CLI prompts). */
  npm: string;
  /** `org/repo` path on GitHub. */
  repo: string;
  /** Optional documentation URL. */
  website?: string;
  /** Grouping category (e.g. "Physics", "Audio", "Debug"). */
  category: string;
  /** Whether the module is maintained by the GWEN core team. */
  type: "official" | "community";
  /** Deprecated modules are excluded from CLI prompts. */
  deprecated: boolean;
  /** Compatible GWEN version range. */
  compatibility: { gwen: string };
}

/** Shape of the remote registry JSON. */
interface RegistryFile {
  version: string;
  generatedAt: string;
  modules: GwenModule[];
}

/** Disk cache wrapper stored at CACHE_PATH. */
interface CacheEntry {
  /** Unix timestamp (ms) when the registry was last fetched. */
  fetchedAt: number;
  /** Full registry payload. */
  data: RegistryFile;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REGISTRY_URL = "https://raw.githubusercontent.com/gwenjs/modules/main/registry.json";

/** Timeout for remote fetch requests, in milliseconds. */
const TIMEOUT_MS = 3000;

// ─── Helpers (env-driven so tests can override without module reload issues) ──

/** Returns the disk cache path. Overridable via GWEN_REGISTRY_CACHE_PATH. */
function getCachePath(): string {
  return (
    process.env["GWEN_REGISTRY_CACHE_PATH"] ??
    path.join(os.homedir(), ".cache", "gwen", "modules.json")
  );
}

/** Returns the cache TTL in milliseconds. Overridable via GWEN_REGISTRY_TTL_MS. */
function getTtlMs(): number {
  const raw = process.env["GWEN_REGISTRY_TTL_MS"];
  return raw !== undefined ? Number(raw) : 60 * 60 * 1000;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

/**
 * Read the on-disk cache entry. Returns `null` if the file is absent or
 * cannot be parsed.
 */
async function readCache(): Promise<CacheEntry | null> {
  try {
    const raw = await fs.readFile(getCachePath(), "utf8");
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

/**
 * Persist the registry data to disk under the cache path.
 * Creates parent directories as needed.
 *
 * @param data - The full registry payload to cache.
 */
async function writeCache(data: RegistryFile): Promise<void> {
  const p = getCachePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  const entry: CacheEntry = { fetchedAt: Date.now(), data };
  await fs.writeFile(p, JSON.stringify(entry), "utf8");
}

/**
 * Returns `true` if the cache entry is younger than the configured TTL.
 *
 * @param entry - The cache entry to check.
 */
function isCacheFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.fetchedAt < getTtlMs();
}

/**
 * Returns `true` if the cache is fresh but within the last 10 % of the TTL
 * window, meaning a background refresh should be triggered.
 *
 * @param entry - The cache entry to check.
 */
function isNearExpiry(entry: CacheEntry): boolean {
  const age = Date.now() - entry.fetchedAt;
  return age > getTtlMs() * 0.9;
}

// ─── Network ──────────────────────────────────────────────────────────────────

/**
 * Fetch the module registry from GitHub. Rejects on network error, timeout,
 * or a non-2xx HTTP response.
 */
async function fetchRegistry(): Promise<RegistryFile> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  try {
    const res = await fetch(REGISTRY_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`Registry fetch failed: HTTP ${res.status}`);
    return (await res.json()) as RegistryFile;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Trigger a background re-fetch and cache write.
 * Failures are silently swallowed — this is a best-effort optimisation.
 */
function triggerBackgroundRefresh(): void {
  fetchRegistry()
    .then((data) => writeCache(data))
    .catch(() => {
      // intentionally silent
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return the list of available GWEN modules from the registry.
 *
 * Resolution order:
 * 1. Fresh disk cache (< TTL) — returned immediately, background refresh if
 *    within the last 10 % of the TTL window.
 * 2. Remote fetch (GitHub raw) — result written to cache.
 * 3. Bundled fallback (`src/data/modules-registry.ts`) — used when offline.
 *
 * Deprecated modules are always excluded from the returned list.
 *
 * @returns A promise that resolves to the filtered list of active modules.
 */
export async function getModules(): Promise<GwenModule[]> {
  const cache = await readCache();
  let registry: RegistryFile;

  if (cache && isCacheFresh(cache)) {
    registry = cache.data;
    if (isNearExpiry(cache)) {
      triggerBackgroundRefresh();
    }
  } else {
    try {
      registry = await fetchRegistry();
      await writeCache(registry);
    } catch {
      logger.warn("Could not reach the GWEN module registry. Using bundled offline list.");
      registry = fallbackRegistry as unknown as RegistryFile;
    }
  }

  return registry.modules.filter((m) => !m.deprecated);
}
