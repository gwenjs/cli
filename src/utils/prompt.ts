/**
 * prompt — shared readline prompt utility.
 *
 * Provides a thin wrapper around Node's `readline` module so scaffold
 * commands can ask the user for a single string without duplicating the
 * boilerplate.
 *
 * @example
 * ```typescript
 * const name = await promptString("Module name");
 * ```
 */

import readline from "node:readline";

/**
 * Prompts the user for a single-line string via stdin.
 *
 * @param label - The label shown before the colon (e.g. `"Module name"`).
 * @returns The trimmed answer entered by the user.
 */
export async function promptString(label: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    process.stdout.write(`${label}: `);
    rl.once("line", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
