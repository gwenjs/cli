/**
 * Input validation utilities for CLI commands.
 */

/**
 * Validates that a name is safe to use as a path component.
 *
 * Rejects names that:
 * - Contain path separators (`/`, `\`)
 * - Contain parent directory traversal (`..`)
 * - Are empty or consist only of whitespace
 * - Do not match the allowed identifier pattern (kebab-case / snake_case)
 *
 * @param name - The name to validate.
 * @returns `true` if the name is safe, `false` otherwise.
 */
export function isValidName(name: string): boolean {
  if (!name || !name.trim()) return false;
  if (/[/\\]/.test(name)) return false;
  if (/\.\./.test(name)) return false;
  return /^[a-z0-9][a-z0-9\-_]*$/.test(name);
}

/**
 * Error message shown when a name fails validation.
 */
export const INVALID_NAME_MESSAGE =
  "Name must start with a lowercase letter or digit and contain only lowercase letters, digits, hyphens, or underscores (no path separators or '..' sequences).";

/**
 * Normalizes a raw npm scope string by stripping a leading `@`, trimming whitespace,
 * and converting to lowercase.
 * Returns `undefined` if the result is empty.
 *
 * @param raw - The raw scope input from the user (e.g. `"@MonOrg"`, `"monorg"`, `"  "`)
 * @returns The normalized scope without `@` (e.g. `"monorg"`), or `undefined` if blank
 *
 * @example
 * normalizeScope("@MonOrg") // "monorg"
 * normalizeScope("")        // undefined
 */
export function normalizeScope(raw: string): string | undefined {
  const normalized = raw.trim().replace(/^@/, "").trim().toLowerCase();
  return normalized || undefined;
}

/**
 * Returns `true` if the given string is a valid npm scope name.
 *
 * A valid scope:
 * - Contains only lowercase letters, digits, hyphens, and underscores
 * - Is not empty
 * - Does not exceed 214 characters (npm package name limit)
 *
 * @param scope - The scope to validate (without leading `@`)
 */
export function isValidScope(scope: string): boolean {
  if (!scope || scope.length > 214) return false;
  return /^[a-z0-9][a-z0-9\-_]*$/.test(scope);
}
