/**
 * Global CLI arguments (available on all commands)
 */

export const GLOBAL_ARGS = {
  verbose: {
    type: "boolean" as const,
    alias: "v",
    description: "Show detailed logs",
  },
  debug: {
    type: "boolean" as const,
    description: "Show debug information (very verbose)",
  },
} as const;

/**
 * Parses and validates a port number from CLI input.
 *
 * @param input - Raw value from CLI args.
 * @returns The parsed port as a number.
 * @throws If the value is not an integer in the range 1024–65535.
 */
export function parsePort(input: unknown): number {
  const port = Number(input);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("Port must be between 1024 and 65535");
  }
  return port;
}
