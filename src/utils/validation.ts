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
