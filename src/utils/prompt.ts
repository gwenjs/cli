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

/**
 * A single choice item for {@link promptSelect}.
 */
export interface SelectChoice<T extends string> {
  label: string;
  value: T;
}

/**
 * Prompts the user to pick one item from a list using arrow keys and Enter.
 *
 * Falls back to the first choice when stdin is not a TTY (CI, piped input).
 *
 * @param label   - The question shown above the list.
 * @param choices - Available options; each has a displayed `label` and a returned `value`.
 * @returns The `value` of the selected choice.
 */
export async function promptSelect<T extends string>(
  label: string,
  choices: SelectChoice<T>[],
): Promise<T> {
  if (!process.stdin.isTTY) {
    return choices[0]!.value;
  }

  return new Promise((resolve) => {
    let index = 0;

    const render = () => {
      process.stdout.write("\x1b[?25l"); // hide cursor
      const lines = choices.map((c, i) => `  ${i === index ? "❯" : " "} ${c.label}`);
      process.stdout.write(`${label}\n${lines.join("\n")}\n`);
    };

    const clear = () => {
      const lineCount = choices.length + 1;
      for (let i = 0; i < lineCount; i++) {
        process.stdout.write("\x1b[1A\x1b[2K");
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    render();

    const onData = (key: string) => {
      if (key === "\u001b[A") {
        index = (index - 1 + choices.length) % choices.length;
        clear();
        render();
      } else if (key === "\u001b[B") {
        index = (index + 1) % choices.length;
        clear();
        render();
      } else if (key === "\r" || key === "\n") {
        process.stdin.removeListener("data", onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\x1b[?25h"); // show cursor
        resolve(choices[index]!.value);
      } else if (key === "\u0003") {
        // Ctrl+C
        process.stdin.setRawMode(false);
        process.stdout.write("\x1b[?25h");
        process.exit(1);
      }
    };

    process.stdin.on("data", onData);
  });
}
