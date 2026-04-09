import { promptString, promptSelect } from "../../../utils/prompt.js";
import { normalizeScope, isValidScope } from "../../../utils/validation.js";

/** The two scaffold modes: a standard plugin package or a renderer package. */
export type PackageType = "standard" | "renderer";

export interface ScaffoldPackageOptions {
  name: string;
  gwenVersion: string;
  /** Whether to generate renderer-specific templates and add @gwenjs/renderer-core. */
  type: PackageType;
  withCi: boolean;
  withDocs: boolean;
  scope?: string;
}

type RawArgs = {
  name?: string;
  "gwen-version"?: string;
  renderer?: boolean;
  "with-ci"?: boolean;
  "with-docs"?: boolean;
  scope?: string;
};

async function promptBoolean(question: string): Promise<boolean> {
  const rl = await import("node:readline");
  return new Promise((resolve) => {
    const iface = rl.default.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    process.stdout.write(`${question} (y/N): `);
    iface.once("line", (answer) => {
      iface.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

/**
 * Prompts for an optional npm scope, re-prompting on invalid input.
 *
 * @param name - The package name, used in the prompt message.
 * @returns The normalized scope without `@`, or `undefined` if not in TTY or user skipped.
 */
async function promptScope(name: string): Promise<string | undefined> {
  if (!process.stdin.isTTY) return undefined;

  const rl = await import("node:readline");

  while (true) {
    const raw = await new Promise<string>((resolve) => {
      const iface = rl.default.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      process.stdout.write(`Scope [optional] → @<scope>/${name} (leave blank for none): `);
      iface.once("line", (answer) => {
        iface.close();
        resolve(answer.trim());
      });
    });

    if (!raw) return undefined;

    const normalized = normalizeScope(raw);
    if (!normalized || !isValidScope(normalized)) {
      console.error("Invalid scope. Use lowercase letters, digits, hyphens, underscores.");
      continue;
    }
    return normalized;
  }
}

/**
 * Resolves scaffold package options from CLI args and interactive prompts.
 *
 * Resolution order (highest priority first):
 * 1. Explicit CLI flags
 * 2. Interactive prompts (skipped in non-TTY environments — first choice used as default)
 * 3. Defaults
 *
 * @param args - Raw CLI arguments from citty.
 * @returns Resolved scaffold options.
 */
export async function resolveOptions(args: RawArgs): Promise<ScaffoldPackageOptions> {
  let name = args.name?.trim() ?? "";
  if (!name) {
    name = await promptString("Package name (convention: gwen-<name>)");
  }

  const gwenVersion = args["gwen-version"]?.trim() || "^0.1.0";

  // --renderer flag takes precedence; otherwise ask interactively.
  let type: PackageType;
  if (args.renderer !== undefined) {
    type = args.renderer ? "renderer" : "standard";
  } else {
    type = await promptSelect<PackageType>("Package type", [
      { label: "Standard package", value: "standard" },
      { label: "Renderer package", value: "renderer" },
    ]);
  }

  const withCi =
    args["with-ci"] !== undefined
      ? Boolean(args["with-ci"])
      : await promptBoolean("Include GitHub Actions CI + publish workflows?");

  const withDocs =
    args["with-docs"] !== undefined
      ? Boolean(args["with-docs"])
      : await promptBoolean("Include VitePress documentation?");

  // Scope
  let scope: string | undefined;
  if (args.scope !== undefined) {
    const normalized = normalizeScope(args.scope);
    if (!normalized || !isValidScope(normalized)) {
      throw new Error(
        `Invalid scope: "${args.scope}". Use lowercase letters, digits, hyphens, underscores.`,
      );
    }
    scope = normalized;
  } else {
    scope = await promptScope(name);
  }

  return { name, gwenVersion, type, withCi, withDocs, scope };
}
