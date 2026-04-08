/**
 * `gwen scaffold` command group
 *
 * Scaffolds community plugin packages for the GWEN ecosystem.
 *
 * @example
 * ```bash
 * gwen scaffold package my-plugin
 * gwen scaffold package my-renderer --renderer
 * ```
 */

import { defineCommand } from "citty";
import { scaffoldPackageCommand } from "./package/index.js";

/**
 * The `scaffold` command exposes sub-commands for code generation.
 * Exported as a default so bin.ts can register it under `scaffold`.
 */
export default defineCommand({
  meta: {
    name: "scaffold",
    description: "Scaffold a community plugin package",
  },
  subCommands: {
    package: scaffoldPackageCommand,
  },
});
