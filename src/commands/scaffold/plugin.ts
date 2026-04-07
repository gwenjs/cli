/**
 * `gwen scaffold plugin` command
 *
 * Generates a minimal runtime-plugin stub using the `definePlugin` pattern
 * at `src/plugins/<name>/index.ts`.
 *
 * @example
 * ```bash
 * gwen scaffold plugin my-renderer
 * ```
 */

import fs from "node:fs/promises";
import path from "node:path";
import { defineCommand } from "citty";
import { logger } from "../../utils/logger.js";
import { isValidName, INVALID_NAME_MESSAGE } from "../../utils/validation.js";
import { ExitCode } from "../../utils/constants.js";
import { promptString } from "../../utils/prompt.js";

/**
 * Generates the plugin stub source code.
 *
 * @param name - The plugin name (used as the plugin identifier and export name).
 */
function pluginTemplate(name: string): string {
  const exportName = `${name}Plugin`;
  return `import { definePlugin } from '@gwenjs/kit'
import type { GwenEngine } from '@gwenjs/core'

/**
 * ${name} plugin
 *
 * TODO: implement your plugin here.
 */
export const ${exportName} = definePlugin(() => {
  let engine: GwenEngine

  return {
    name: '${name}',

    setup(e: GwenEngine) {
      engine = e
      // Called once when the engine initialises.
      // Register services: engine.provide('myService', myService)
    },

    onBeforeUpdate(_dt: number) {
      // Called before the update phase each frame.
    },

    onUpdate(_dt: number) {
      // Called every render frame.
    },

    onAfterUpdate(_dt: number) {
      // Called after the update phase each frame.
    },

    onRender() {
      // Called during the render pass.
    },

    teardown() {
      // Called when the engine shuts down — release all resources here.
    },
  }
})
`;
}

/** Named export consumed by scaffold/index.ts and tests. */
export const scaffoldPluginCommand = defineCommand({
  meta: {
    name: "plugin",
    description: "Scaffold a runtime plugin stub",
  },
  args: {
    name: {
      type: "positional",
      description: "Plugin name",
      required: false,
    },
  },
  async run({ args }) {
    let name = (args.name as string | undefined)?.trim() ?? "";

    if (!name) {
      name = await promptString("Plugin name");
    }

    if (!name) {
      logger.error("[GWEN:scaffold:plugin] Plugin name cannot be empty.");
      process.exit(ExitCode.ERROR_VALIDATION);
    }

    if (!isValidName(name)) {
      logger.error(`[GWEN:scaffold:plugin] Invalid plugin name: ${INVALID_NAME_MESSAGE}`);
      process.exit(ExitCode.ERROR_VALIDATION);
    }

    const outputDir = path.join(process.cwd(), "src", "plugins", name);
    const outputFile = path.join(outputDir, "index.ts");

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputFile, pluginTemplate(name), "utf8");

    logger.success(`✓ Plugin stub created at src/plugins/${name}/index.ts`);
  },
});
