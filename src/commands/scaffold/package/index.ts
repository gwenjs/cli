import fs from "node:fs/promises";
import path from "node:path";
import { defineCommand } from "citty";
import { logger } from "../../../utils/logger.js";
import { isValidName, INVALID_NAME_MESSAGE } from "../../../utils/validation.js";
import { ExitCode } from "../../../utils/constants.js";
import { resolveOptions, type ScaffoldPackageOptions } from "./options.js";
import type { PackageType } from "./options.js";
import {
  packageJsonTemplate,
  tsconfigTemplate,
  viteConfigTemplate,
  gitignoreTemplate,
  typesTemplate,
  augmentTemplate,
  pluginTemplate,
  composablesTemplate,
  moduleTemplate,
  indexTemplate,
} from "./templates/base.js";
import {
  ciWorkflowTemplate,
  releaseWorkflowTemplate,
  releasePleaseConfigTemplate,
  releasePleaseManifestTemplate,
} from "./templates/ci.js";
import {
  vitepressConfigTemplate,
  docsIndexTemplate,
  docsGettingStartedTemplate,
  docsApiTemplate,
  docsExamplesTemplate,
  deployDocsWorkflowTemplate,
} from "./templates/docs.js";
import {
  rendererTypesTemplate,
  rendererServiceTemplate,
  rendererPluginTemplate,
  rendererComposablesTemplate,
  rendererModuleTemplate,
  rendererAugmentTemplate,
  rendererIndexTemplate,
  conformanceTestTemplate,
} from "./templates/renderer.js";

// Re-export all template functions for backward compatibility with tests
export {
  toPascalCase,
  toCamelCase,
  toPackageName,
  packageJsonTemplate,
  tsconfigTemplate,
  viteConfigTemplate,
  gitignoreTemplate,
  typesTemplate,
  augmentTemplate,
  pluginTemplate,
  composablesTemplate,
  moduleTemplate,
  indexTemplate,
} from "./templates/base.js";

export { buildPackageJson };

/**
 * Builds a package.json content string for a GWEN plugin package.
 *
 * @param name - The plugin name in kebab-case (e.g. "my-plugin")
 * @param gwenVersion - The GWEN peer dependency version range (e.g. "^0.1.0")
 * @param withDocs - Whether to include VitePress documentation scripts and dependencies
 * @param type - The package type: "standard" or "renderer"
 * @param scope - Optional npm scope without `@` (e.g. "monorg")
 * @returns JSON string ready to write to package.json
 */
function buildPackageJson(
  name: string,
  gwenVersion: string,
  withDocs: boolean,
  type: PackageType = "standard",
  scope?: string,
): string {
  const base = JSON.parse(packageJsonTemplate(name, gwenVersion, scope));

  if (type === "renderer") {
    base.dependencies["@gwenjs/renderer-core"] = gwenVersion;
  }

  if (withDocs) {
    base.scripts["docs:dev"] = "vitepress dev docs";
    base.scripts["docs:build"] = "vitepress build docs";
    base.scripts["docs:preview"] = "vitepress preview docs";
    base.devDependencies["vitepress"] = "latest";
  }

  return JSON.stringify(base, null, 2);
}

export async function generateFiles(
  opts: ScaffoldPackageOptions,
  cwd: string = process.cwd(),
): Promise<void> {
  const { name, gwenVersion, withCi, withDocs, scope } = opts;
  const type: PackageType = opts.type ?? "standard";
  const outputDir = path.join(cwd, name);
  const srcDir = path.join(outputDir, "src");

  await fs.mkdir(srcDir, { recursive: true });

  const sharedFiles: Array<[string, string]> = [
    [path.join(outputDir, ".gitignore"), gitignoreTemplate()],
    [
      path.join(outputDir, "package.json"),
      buildPackageJson(name, gwenVersion, withDocs, type, scope),
    ],
    [path.join(outputDir, "tsconfig.json"), tsconfigTemplate()],
    [path.join(outputDir, "vite.config.ts"), viteConfigTemplate()],
  ];

  const sourceFiles: Array<[string, string]> =
    type === "renderer"
      ? [
          [path.join(srcDir, "types.ts"), rendererTypesTemplate(name, scope)],
          [path.join(srcDir, "renderer-service.ts"), rendererServiceTemplate(name, scope)],
          [path.join(srcDir, "plugin.ts"), rendererPluginTemplate(name, scope)],
          [path.join(srcDir, "composables.ts"), rendererComposablesTemplate(name, scope)],
          [path.join(srcDir, "module.ts"), rendererModuleTemplate(name, scope)],
          [path.join(srcDir, "augment.ts"), rendererAugmentTemplate(name, scope)],
          [path.join(srcDir, "index.ts"), rendererIndexTemplate(name, scope)],
        ]
      : [
          [path.join(srcDir, "types.ts"), typesTemplate(name, scope)],
          [path.join(srcDir, "augment.ts"), augmentTemplate(name, scope)],
          [path.join(srcDir, "plugin.ts"), pluginTemplate(name, scope)],
          [path.join(srcDir, "composables.ts"), composablesTemplate(name, scope)],
          [path.join(srcDir, "module.ts"), moduleTemplate(name, scope)],
          [path.join(srcDir, "index.ts"), indexTemplate(name)],
        ];

  const files: Array<[string, string]> = [...sharedFiles, ...sourceFiles];

  if (type === "renderer") {
    const testsDir = path.join(outputDir, "tests");
    await fs.mkdir(testsDir, { recursive: true });
    files.push([path.join(testsDir, "conformance.test.ts"), conformanceTestTemplate(name, scope)]);
  }

  if (withCi) {
    const workflowsDir = path.join(outputDir, ".github", "workflows");
    await fs.mkdir(workflowsDir, { recursive: true });
    files.push(
      [path.join(workflowsDir, "ci.yml"), ciWorkflowTemplate()],
      [path.join(workflowsDir, "release.yml"), releaseWorkflowTemplate()],
      [path.join(outputDir, "release-please-config.json"), releasePleaseConfigTemplate()],
      [path.join(outputDir, ".release-please-manifest.json"), releasePleaseManifestTemplate()],
    );
  }

  if (withDocs) {
    const vitepressDir = path.join(outputDir, "docs", ".vitepress");
    const guideDir = path.join(outputDir, "docs", "guide");
    const apiDir = path.join(outputDir, "docs", "api");
    const examplesDir = path.join(outputDir, "docs", "examples");
    const workflowsDir = path.join(outputDir, ".github", "workflows");
    await fs.mkdir(vitepressDir, { recursive: true });
    await fs.mkdir(guideDir, { recursive: true });
    await fs.mkdir(apiDir, { recursive: true });
    await fs.mkdir(examplesDir, { recursive: true });
    await fs.mkdir(workflowsDir, { recursive: true });
    files.push(
      [path.join(vitepressDir, "config.ts"), vitepressConfigTemplate(name, scope)],
      [path.join(outputDir, "docs", "index.md"), docsIndexTemplate(name, scope)],
      [path.join(guideDir, "getting-started.md"), docsGettingStartedTemplate(name, scope)],
      [path.join(apiDir, "index.md"), docsApiTemplate(name, scope)],
      [path.join(examplesDir, "index.md"), docsExamplesTemplate(name, scope)],
      [path.join(workflowsDir, "deploy-docs.yml"), deployDocsWorkflowTemplate()],
    );
  }

  for (const [filePath, content] of files) {
    await fs.writeFile(filePath, content, "utf8");
  }
}

export const scaffoldPackageCommand = defineCommand({
  meta: {
    name: "package",
    description: "Scaffold a complete community plugin package",
  },
  args: {
    name: {
      type: "positional",
      description: "Package name (kebab-case, e.g. my-plugin)",
      required: false,
    },
    "gwen-version": {
      type: "string",
      description: "GWEN peer dependency version range",
      default: "^0.1.0",
    },
    renderer: {
      type: "boolean",
      description: "Generate a renderer package instead of a standard plugin package",
    },
    "with-ci": {
      type: "boolean",
      description: "Include GitHub Actions CI + publish workflows",
    },
    "with-docs": {
      type: "boolean",
      description: "Include VitePress documentation",
    },
    scope: {
      type: "string",
      description: "npm scope for the package (e.g. myorg or @myorg)",
    },
  },
  async run({ args }) {
    const opts = await resolveOptions(args as Parameters<typeof resolveOptions>[0]);

    if (!opts.name) {
      logger.error("[GWEN:scaffold:package] Package name cannot be empty.");
      process.exit(ExitCode.ERROR_VALIDATION);
    }

    if (!isValidName(opts.name)) {
      logger.error(`[GWEN:scaffold:package] Invalid package name: ${INVALID_NAME_MESSAGE}`);
      process.exit(ExitCode.ERROR_VALIDATION);
    }

    await generateFiles(opts);

    const label = opts.type === "renderer" ? "Renderer package" : "Package";
    logger.success(`✓ ${label} scaffolded at ${opts.name}/`);
    logger.info("");
    logger.info("Next steps:");
    logger.info(`  cd ${opts.name}`);
    logger.info("  pnpm install");
    if (opts.type === "renderer") {
      logger.info("  pnpm test         — run the conformance suite");
    } else {
      logger.info("  pnpm dev");
    }
    logger.info("");
    if (opts.withCi) {
      logger.info("CI/CD:");
      logger.info("  Add NPM_TOKEN secret to your GitHub repository settings");
      logger.info("");
    }
    if (opts.withDocs) {
      logger.info("Documentation:");
      logger.info("  pnpm docs:dev   — start local docs server");
      logger.info("  Enable GitHub Pages in your repository settings");
      logger.info("");
    }
    logger.info("Implement your logic in:");
    if (opts.type === "renderer") {
      logger.info("  src/renderer-service.ts   — mount, unmount, resize, flush");
      logger.info("  src/composables.ts        — useMyRenderer() composable");
    } else {
      logger.info("  src/types.ts   — config & service interface");
      logger.info("  src/plugin.ts  — runtime plugin logic");
    }
  },
});
