import fs from "node:fs/promises";
import path from "node:path";
import { defineCommand } from "citty";
import { logger } from "../../../utils/logger.js";
import { isValidName, INVALID_NAME_MESSAGE } from "../../../utils/validation.js";
import { ExitCode } from "../../../utils/constants.js";
import { resolveOptions, type ScaffoldPackageOptions } from "./options.js";
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

// Re-export all template functions for backward compatibility with tests
export {
  toPascalCase,
  toCamelCase,
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

function buildPackageJson(name: string, gwenVersion: string, withDocs: boolean): string {
  const base = JSON.parse(packageJsonTemplate(name, gwenVersion));

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
  const { name, gwenVersion, withCi, withDocs } = opts;
  const outputDir = path.join(cwd, name);
  const srcDir = path.join(outputDir, "src");

  await fs.mkdir(srcDir, { recursive: true });

  const files: Array<[string, string]> = [
    [path.join(outputDir, ".gitignore"), gitignoreTemplate()],
    [path.join(outputDir, "package.json"), buildPackageJson(name, gwenVersion, withDocs)],
    [path.join(outputDir, "tsconfig.json"), tsconfigTemplate()],
    [path.join(outputDir, "vite.config.ts"), viteConfigTemplate()],
    [path.join(srcDir, "types.ts"), typesTemplate(name)],
    [path.join(srcDir, "augment.ts"), augmentTemplate(name)],
    [path.join(srcDir, "plugin.ts"), pluginTemplate(name)],
    [path.join(srcDir, "composables.ts"), composablesTemplate(name)],
    [path.join(srcDir, "module.ts"), moduleTemplate(name)],
    [path.join(srcDir, "index.ts"), indexTemplate(name)],
  ];

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
      [path.join(vitepressDir, "config.ts"), vitepressConfigTemplate(name)],
      [path.join(outputDir, "docs", "index.md"), docsIndexTemplate(name)],
      [path.join(guideDir, "getting-started.md"), docsGettingStartedTemplate(name)],
      [path.join(apiDir, "index.md"), docsApiTemplate(name)],
      [path.join(examplesDir, "index.md"), docsExamplesTemplate(name)],
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

    logger.success(`✓ Package scaffolded at ${opts.name}/`);
    logger.info("");
    logger.info("Next steps:");
    logger.info(`  cd ${opts.name}`);
    logger.info("  pnpm install");
    logger.info("  pnpm dev");
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
    logger.info("  src/types.ts   — config & service interface");
    logger.info("  src/plugin.ts  — runtime plugin logic");
  },
});
