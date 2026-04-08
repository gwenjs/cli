/**
 * Tests for `gwen scaffold package` — verifies templates produce correct
 * file content and the full scaffold generates the expected file tree.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  toPascalCase,
  toCamelCase,
  packageJsonTemplate,
  tsconfigTemplate,
  viteConfigTemplate,
  typesTemplate,
  augmentTemplate,
  pluginTemplate,
  composablesTemplate,
  moduleTemplate,
  indexTemplate,
} from "../../src/commands/scaffold/package/templates/base.js";
import {
  rendererTypesTemplate,
  rendererServiceTemplate,
  rendererPluginTemplate,
  rendererComposablesTemplate,
  rendererModuleTemplate,
  rendererAugmentTemplate,
  rendererIndexTemplate,
  conformanceTestTemplate,
} from "../../src/commands/scaffold/package/templates/renderer.js";
import { resolveOptions } from "../../src/commands/scaffold/package/options.js";
import { promptSelect } from "../../src/utils/prompt.js";
import scaffoldCommand from "../../src/commands/scaffold/index.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "gwen-scaffold-pkg-"));
}

async function fileExists(p: string): Promise<boolean> {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

describe("toPascalCase", () => {
  it("converts kebab-case to PascalCase", () => {
    expect(toPascalCase("my-plugin")).toBe("MyPlugin");
  });
  it("converts single word", () => {
    expect(toPascalCase("audio")).toBe("Audio");
  });
  it("converts multi-word with underscores", () => {
    expect(toPascalCase("my_cool_plugin")).toBe("MyCoolPlugin");
  });
});

describe("toCamelCase", () => {
  it("converts kebab-case to camelCase", () => {
    expect(toCamelCase("my-plugin")).toBe("myPlugin");
  });
  it("converts single word", () => {
    expect(toCamelCase("audio")).toBe("audio");
  });
});

// ─── Template unit tests ──────────────────────────────────────────────────────

describe("packageJsonTemplate", () => {
  it("sets the correct package name", () => {
    const pkg = JSON.parse(packageJsonTemplate("my-plugin", "^0.1.0"));
    expect(pkg.name).toBe("@community/gwen-my-plugin");
  });

  it("starts at version 0.1.0", () => {
    const pkg = JSON.parse(packageJsonTemplate("audio", "^0.1.0"));
    expect(pkg.version).toBe("0.1.0");
  });

  it('exports "." and "./module" entry points', () => {
    const pkg = JSON.parse(packageJsonTemplate("audio", "^0.1.0"));
    expect(pkg.exports["."]).toBeDefined();
    expect(pkg.exports["./module"]).toBeDefined();
  });

  it("includes @gwenjs/core and @gwenjs/kit in dependencies", () => {
    const pkg = JSON.parse(packageJsonTemplate("audio", "^0.2.0"));
    expect(pkg.dependencies["@gwenjs/core"]).toBe("^0.2.0");
    expect(pkg.dependencies["@gwenjs/kit"]).toBe("^0.2.0");
  });

  it("puts vite and typescript in devDependencies", () => {
    const pkg = JSON.parse(packageJsonTemplate("audio", "^0.1.0"));
    expect(pkg.devDependencies["vite"]).toBeDefined();
    expect(pkg.devDependencies["typescript"]).toBeDefined();
    expect(pkg.devDependencies["vitest"]).toBeDefined();
    expect(pkg.dependencies["vite"]).toBeUndefined();
  });

  it("has all required scripts", () => {
    const pkg = JSON.parse(packageJsonTemplate("audio", "^0.1.0"));
    expect(pkg.scripts.build).toBe("vite build");
    expect(pkg.scripts.test).toBe("vitest run");
    expect(pkg.scripts.typecheck).toBe("tsc --noEmit");
  });
});

describe("typesTemplate", () => {
  it("exports <Name>Config and <Name>Service", () => {
    const content = typesTemplate("audio");
    expect(content).toContain("export interface AudioConfig");
    expect(content).toContain("export interface AudioService");
  });

  it("uses PascalCase from kebab-case name", () => {
    const content = typesTemplate("my-plugin");
    expect(content).toContain("export interface MyPluginConfig");
    expect(content).toContain("export interface MyPluginService");
  });
});

describe("augmentTemplate", () => {
  it("augments GwenProvides with the service key", () => {
    const content = augmentTemplate("audio");
    expect(content).toContain("interface GwenProvides");
    expect(content).toContain("audio: AudioService");
  });

  it("imports the service type from ./types.js", () => {
    const content = augmentTemplate("audio");
    expect(content).toContain("from './types.js'");
  });
});

describe("pluginTemplate", () => {
  it("imports from types.js not index.ts", () => {
    const content = pluginTemplate("audio");
    expect(content).toContain("from './types.js'");
    expect(content).not.toContain("from './index");
  });

  it("exports the plugin as <Name>Plugin", () => {
    const content = pluginTemplate("audio");
    expect(content).toContain("export const AudioPlugin = definePlugin");
  });

  it("calls engine.provide with the correct key", () => {
    const content = pluginTemplate("audio");
    expect(content).toContain("engine.provide('audio'");
  });
});

describe("composablesTemplate", () => {
  it("imports augment.ts as side-effect", () => {
    const content = composablesTemplate("audio");
    expect(content).toContain("import './augment.js'");
  });

  it("exports use<Name>()", () => {
    const content = composablesTemplate("audio");
    expect(content).toContain("export function useAudio()");
  });

  it("throws GwenPluginNotFoundError with helpful hint", () => {
    const content = composablesTemplate("audio");
    expect(content).toContain("GwenPluginNotFoundError");
    expect(content).toContain("@community/gwen-audio");
  });
});

describe("moduleTemplate", () => {
  it("never imports from index.ts", () => {
    const content = moduleTemplate("audio");
    // Only check actual import statements (not comment lines)
    const importLines = content
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("*") && !line.trimStart().startsWith("//"))
      .join("\n");
    expect(importLines).not.toContain("from './index");
    expect(importLines).not.toContain('from "./index');
  });

  it("imports plugin lazily from plugin.js", () => {
    const content = moduleTemplate("audio");
    expect(content).toContain("import('./plugin.js')");
  });

  it("calls kit.addPlugin, kit.addAutoImports, kit.addTypeTemplate", () => {
    const content = moduleTemplate("audio");
    expect(content).toContain("kit.addPlugin");
    expect(content).toContain("kit.addAutoImports");
    expect(content).toContain("kit.addTypeTemplate");
  });

  it("registers the composable for auto-import", () => {
    const content = moduleTemplate("audio");
    expect(content).toContain("name: 'useAudio'");
    expect(content).toContain("from: '@community/gwen-audio'");
  });
});

describe("indexTemplate", () => {
  it("imports augment.ts as side-effect", () => {
    const content = indexTemplate("audio");
    expect(content).toContain("import './augment.js'");
  });

  it("re-exports plugin, composables and types", () => {
    const content = indexTemplate("audio");
    expect(content).toContain("from './plugin.js'");
    expect(content).toContain("from './composables.js'");
    expect(content).toContain("from './types.js'");
  });

  it("does NOT re-export module.ts", () => {
    const content = indexTemplate("audio");
    expect(content).not.toContain("from './module");
  });
});

// ─── Integration test ─────────────────────────────────────────────────────────

import { generateFiles } from "../../src/commands/scaffold/package/index.js";

describe("generateFiles integration", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("generates base files only when withCi=false and withDocs=false", async () => {
    await generateFiles(
      { name: "test-plugin", gwenVersion: "^0.1.0", withCi: false, withDocs: false },
      tmpDir,
    );

    const outputDir = path.join(tmpDir, "test-plugin");
    expect(await fileExists(path.join(outputDir, "package.json"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "tsconfig.json"))).toBe(true);
    expect(await fileExists(path.join(outputDir, ".gitignore"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "src/index.ts"))).toBe(true);
    expect(await fileExists(path.join(outputDir, ".github/workflows/ci.yml"))).toBe(false);
    expect(await fileExists(path.join(outputDir, "docs/index.md"))).toBe(false);
  });

  it("generates CI files when withCi=true", async () => {
    await generateFiles(
      { name: "test-plugin", gwenVersion: "^0.1.0", withCi: true, withDocs: false },
      tmpDir,
    );

    const outputDir = path.join(tmpDir, "test-plugin");
    expect(await fileExists(path.join(outputDir, ".github/workflows/ci.yml"))).toBe(true);
    expect(await fileExists(path.join(outputDir, ".github/workflows/release.yml"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "release-please-config.json"))).toBe(true);
    expect(await fileExists(path.join(outputDir, ".release-please-manifest.json"))).toBe(true);
  });

  it("generates docs files when withDocs=true", async () => {
    await generateFiles(
      { name: "test-plugin", gwenVersion: "^0.1.0", withCi: false, withDocs: true },
      tmpDir,
    );

    const outputDir = path.join(tmpDir, "test-plugin");
    expect(await fileExists(path.join(outputDir, "docs/index.md"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "docs/guide/getting-started.md"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "docs/api/index.md"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "docs/examples/index.md"))).toBe(true);
    expect(await fileExists(path.join(outputDir, "docs/.vitepress/config.ts"))).toBe(true);
    expect(await fileExists(path.join(outputDir, ".github/workflows/deploy-docs.yml"))).toBe(true);
  });

  it("package.json includes docs scripts when withDocs=true", async () => {
    await generateFiles(
      { name: "test-plugin", gwenVersion: "^0.1.0", withCi: false, withDocs: true },
      tmpDir,
    );
    const outputDir = path.join(tmpDir, "test-plugin");
    const pkg = JSON.parse(await fs.readFile(path.join(outputDir, "package.json"), "utf8"));
    expect(pkg.scripts["docs:dev"]).toBe("vitepress dev docs");
    expect(pkg.scripts["docs:build"]).toBe("vitepress build docs");
    expect(pkg.scripts["docs:preview"]).toBe("vitepress preview docs");
    expect(pkg.devDependencies["vitepress"]).toBeDefined();
  });
});

describe("resolveOptions", () => {
  it("uses flag values when all flags provided", async () => {
    const opts = await resolveOptions({
      name: "my-plugin",
      "gwen-version": "^0.2.0",
      "with-ci": true,
      "with-docs": true,
    });
    expect(opts.name).toBe("my-plugin");
    expect(opts.gwenVersion).toBe("^0.2.0");
    expect(opts.withCi).toBe(true);
    expect(opts.withDocs).toBe(true);
    expect(opts.type).toBe("standard");
  });

  it("defaults gwenVersion to ^0.1.0 when not provided", async () => {
    const opts = await resolveOptions({ name: "audio", "with-ci": false, "with-docs": false });
    expect(opts.gwenVersion).toBe("^0.1.0");
  });

  it("defaults withCi and withDocs to false when flags are false", async () => {
    const opts = await resolveOptions({ name: "audio", "with-ci": false, "with-docs": false });
    expect(opts.withCi).toBe(false);
    expect(opts.withDocs).toBe(false);
  });

  it("sets type to 'renderer' when renderer flag is true", async () => {
    const opts = await resolveOptions({
      name: "my-renderer",
      renderer: true,
      "with-ci": false,
      "with-docs": false,
    });
    expect(opts.type).toBe("renderer");
  });

  it("sets type to 'standard' when renderer flag is false", async () => {
    const opts = await resolveOptions({
      name: "my-plugin",
      renderer: false,
      "with-ci": false,
      "with-docs": false,
    });
    expect(opts.type).toBe("standard");
  });

  it("sets type to 'standard' when renderer flag is absent (non-TTY defaults to first choice)", async () => {
    const opts = await resolveOptions({
      name: "my-plugin",
      "with-ci": false,
      "with-docs": false,
    });
    expect(opts.type).toBe("standard");
  });
});

// ─── CI Workflow templates ────────────────────────────────────────────────────

import {
  ciWorkflowTemplate,
  releaseWorkflowTemplate,
  releasePleaseConfigTemplate,
  releasePleaseManifestTemplate,
} from "../../src/commands/scaffold/package/templates/ci.js";

describe("ciWorkflowTemplate", () => {
  it("triggers on push and pull_request to main", () => {
    const content = ciWorkflowTemplate();
    expect(content).toContain("branches: [main]");
    expect(content).toContain("push:");
    expect(content).toContain("pull_request:");
  });

  it("runs lint, typecheck, test, build steps", () => {
    const content = ciWorkflowTemplate();
    expect(content).toContain("pnpm lint");
    expect(content).toContain("pnpm typecheck");
    expect(content).toContain("pnpm test");
    expect(content).toContain("pnpm build");
  });
});

describe("releaseWorkflowTemplate", () => {
  it("uses release-please-action", () => {
    const content = releaseWorkflowTemplate();
    expect(content).toContain("googleapis/release-please-action");
  });

  it("publishes to npm on release", () => {
    const content = releaseWorkflowTemplate();
    expect(content).toContain("pnpm publish");
    expect(content).toContain("NPM_TOKEN");
  });
});

describe("releasePleaseConfigTemplate", () => {
  it("is valid JSON with release-type node", () => {
    const parsed = JSON.parse(releasePleaseConfigTemplate());
    expect(parsed["release-type"]).toBe("node");
  });
});

describe("releasePleaseManifestTemplate", () => {
  it("is valid JSON with version 0.1.0", () => {
    const parsed = JSON.parse(releasePleaseManifestTemplate());
    expect(parsed["."]).toBe("0.1.0");
  });
});

import {
  vitepressConfigTemplate,
  docsIndexTemplate,
  docsGettingStartedTemplate,
  docsApiTemplate,
  docsExamplesTemplate,
  deployDocsWorkflowTemplate,
} from "../../src/commands/scaffold/package/templates/docs.js";

describe("vitepressConfigTemplate", () => {
  it("sets title to the package name", () => {
    const content = vitepressConfigTemplate("my-plugin");
    expect(content).toContain("my-plugin");
  });

  it("contains a guide and api section in sidebar", () => {
    const content = vitepressConfigTemplate("my-plugin");
    expect(content).toContain("/guide/");
    expect(content).toContain("/api/");
  });
});

describe("docsIndexTemplate", () => {
  it("references the package name in hero text", () => {
    const content = docsIndexTemplate("my-plugin");
    expect(content).toContain("my-plugin");
  });
});

describe("docsGettingStartedTemplate", () => {
  it("includes install command with package name", () => {
    const content = docsGettingStartedTemplate("my-plugin");
    expect(content).toContain("@community/gwen-my-plugin");
  });
});

describe("docsApiTemplate", () => {
  it("uses PascalCase for service name", () => {
    const content = docsApiTemplate("my-plugin");
    expect(content).toContain("MyPluginService");
  });
});

describe("deployDocsWorkflowTemplate", () => {
  it("deploys to GitHub Pages", () => {
    const content = deployDocsWorkflowTemplate();
    expect(content).toContain("actions/deploy-pages");
    expect(content).toContain("pnpm docs:build");
  });
});

// ─── resolveOptions interactive branches ─────────────────────────────────────

describe("resolveOptions — interactive prompt branches", () => {
  beforeEach(() => {
    vi.mock("node:readline", () => {
      const mockRl = {
        once: vi.fn((event: string, cb: (line: string) => void) => {
          if (event === "line") cb("y");
        }),
        close: vi.fn(),
      };
      return {
        default: {
          createInterface: vi.fn(() => mockRl),
        },
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prompts for withCi and withDocs when flags are omitted", async () => {
    // vi.mock hoists, so readline mock is active; "y" means true
    const opts = await resolveOptions({ name: "prompted-pkg" });
    expect(opts.name).toBe("prompted-pkg");
    expect(typeof opts.withCi).toBe("boolean");
    expect(typeof opts.withDocs).toBe("boolean");
  });

  it("trims whitespace from gwen-version", async () => {
    const opts = await resolveOptions({
      name: "pkg",
      "gwen-version": "  ^1.0.0  ",
      "with-ci": false,
      "with-docs": false,
    });
    expect(opts.gwenVersion).toBe("^1.0.0");
  });
});

describe("promptSelect", () => {
  it("returns the first choice immediately when stdin is not a TTY", async () => {
    const originalIsTTY = process.stdin.isTTY;
    (process.stdin as NodeJS.ReadStream & { isTTY: boolean }).isTTY = false;
    try {
      const result = await promptSelect("Pick one", [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
      ]);
      expect(result).toBe("a");
    } finally {
      (process.stdin as NodeJS.ReadStream & { isTTY: boolean }).isTTY = originalIsTTY;
    }
  });
});

describe("scaffold command surface", () => {
  it("does not expose plugin or module subcommands", () => {
    const subs = (scaffoldCommand as any).subCommands ?? {};
    expect(subs.plugin).toBeUndefined();
    expect(subs.module).toBeUndefined();
  });

  it("exposes only the package subcommand", () => {
    const subs = (scaffoldCommand as any).subCommands ?? {};
    expect(subs.package).toBeDefined();
  });
});

// ─── Renderer templates ───────────────────────────────────────────────────────

describe("rendererTypesTemplate", () => {
  it("exports <Name>Options with layers field", () => {
    const src = rendererTypesTemplate("my-renderer");
    expect(src).toContain("export interface MyRendererOptions");
    expect(src).toContain("layers: Record<string, LayerDef>");
  });

  it("imports LayerDef from @gwenjs/renderer-core", () => {
    const src = rendererTypesTemplate("my-renderer");
    expect(src).toContain("from '@gwenjs/renderer-core'");
    expect(src).toContain("LayerDef");
  });

  it("exports <Name>Service interface", () => {
    const src = rendererTypesTemplate("my-renderer");
    expect(src).toContain("export interface MyRendererService");
  });
});

describe("rendererServiceTemplate", () => {
  it("imports defineRendererService from @gwenjs/renderer-core", () => {
    const src = rendererServiceTemplate("my-renderer");
    expect(src).toContain("defineRendererService");
    expect(src).toContain("from '@gwenjs/renderer-core'");
  });

  it("exports the service as <Name>RendererService", () => {
    const src = rendererServiceTemplate("my-renderer");
    expect(src).toContain("export const MyRendererRendererService");
  });

  it("includes all required RendererService members", () => {
    const src = rendererServiceTemplate("my-renderer");
    expect(src).toContain("createElement");
    expect(src).toContain("mount");
    expect(src).toContain("unmount");
    expect(src).toContain("resize");
    expect(src).toContain("flush");
  });

  it("uses renderer:<name> as the service key", () => {
    const src = rendererServiceTemplate("my-renderer");
    expect(src).toContain("renderer:my-renderer");
  });
});

describe("rendererPluginTemplate", () => {
  it("imports getOrCreateLayerManager from @gwenjs/renderer-core", () => {
    const src = rendererPluginTemplate("my-renderer");
    expect(src).toContain("getOrCreateLayerManager");
    expect(src).toContain("from '@gwenjs/renderer-core'");
  });

  it("registers the service with engine.provide", () => {
    const src = rendererPluginTemplate("my-renderer");
    expect(src).toContain("engine.provide('renderer:my-renderer'");
  });

  it("calls manager.register and manager.mount", () => {
    const src = rendererPluginTemplate("my-renderer");
    expect(src).toContain("manager.register");
    expect(src).toContain("manager.mount");
  });

  it("exports the plugin as <Name>Plugin", () => {
    const src = rendererPluginTemplate("my-renderer");
    expect(src).toContain("export const MyRendererPlugin");
  });
});

describe("rendererComposablesTemplate", () => {
  it("imports useService from @gwenjs/core/system", () => {
    const src = rendererComposablesTemplate("my-renderer");
    expect(src).toContain("useService");
    expect(src).toContain("from '@gwenjs/core/system'");
  });

  it("imports onDestroy from @gwenjs/core/actor", () => {
    const src = rendererComposablesTemplate("my-renderer");
    expect(src).toContain("onDestroy");
    expect(src).toContain("from '@gwenjs/core/actor'");
  });

  it("exports useMyRenderer composable", () => {
    const src = rendererComposablesTemplate("my-renderer");
    expect(src).toContain("export function useMyRenderer");
  });

  it("calls useService with renderer:<name> key", () => {
    const src = rendererComposablesTemplate("my-renderer");
    expect(src).toContain("useService('renderer:my-renderer')");
  });

  it("imports augment.ts as side-effect", () => {
    const src = rendererComposablesTemplate("my-renderer");
    expect(src).toContain("import './augment.js'");
  });
});

describe("rendererModuleTemplate", () => {
  it("uses configKey derived from package name", () => {
    const src = rendererModuleTemplate("my-renderer");
    expect(src).toContain("configKey");
    expect(src).toContain("myRenderer");
  });

  it("sets default layers to { main: { order: 0 } }", () => {
    const src = rendererModuleTemplate("my-renderer");
    expect(src).toContain("layers");
    expect(src).toContain("order: 0");
  });

  it("imports plugin lazily from ./plugin.js", () => {
    const src = rendererModuleTemplate("my-renderer");
    expect(src).toContain("import('./plugin.js')");
  });

  it("registers composable for auto-import", () => {
    const src = rendererModuleTemplate("my-renderer");
    expect(src).toContain("useMyRenderer");
    expect(src).toContain("@community/gwen-my-renderer");
  });
});

describe("rendererAugmentTemplate", () => {
  it("augments GwenProvides with renderer:<name> key", () => {
    const src = rendererAugmentTemplate("my-renderer");
    expect(src).toContain("interface GwenProvides");
    expect(src).toContain("'renderer:my-renderer'");
  });
});

describe("rendererIndexTemplate", () => {
  it("re-exports plugin, composables, types", () => {
    const src = rendererIndexTemplate("my-renderer");
    expect(src).toContain("from './plugin.js'");
    expect(src).toContain("from './composables.js'");
    expect(src).toContain("from './types.js'");
  });

  it("imports augment.ts as side-effect", () => {
    const src = rendererIndexTemplate("my-renderer");
    expect(src).toContain("import './augment.js'");
  });

  it("does not re-export module.ts", () => {
    const src = rendererIndexTemplate("my-renderer");
    expect(src).not.toContain("from './module");
  });
});

describe("conformanceTestTemplate", () => {
  it("imports runConformanceTests from @gwenjs/renderer-core/testing", () => {
    const src = conformanceTestTemplate("my-renderer");
    expect(src).toContain("runConformanceTests");
    expect(src).toContain("from '@gwenjs/renderer-core/testing'");
  });

  it("imports the renderer service from ../src/renderer-service.js", () => {
    const src = conformanceTestTemplate("my-renderer");
    expect(src).toContain("from '../src/renderer-service.js'");
  });

  it("creates service with layers: { main: { order: 0 } }", () => {
    const src = conformanceTestTemplate("my-renderer");
    expect(src).toContain("main: { order: 0 }");
  });
});

describe("generateFiles integration — renderer mode", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("generates renderer-specific files when type is renderer", async () => {
    const { generateFiles } = await import("../../src/commands/scaffold/package/index.js");
    await generateFiles(
      { name: "my-renderer", gwenVersion: "^0.1.0", type: "renderer", withCi: false, withDocs: false },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-renderer");
    expect(await fileExists(path.join(out, "src/renderer-service.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "tests/conformance.test.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "src/plugin.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "src/composables.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "src/module.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "src/augment.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "src/index.ts"))).toBe(true);
    expect(await fileExists(path.join(out, "src/types.ts"))).toBe(true);
  });

  it("package.json includes @gwenjs/renderer-core in renderer mode", async () => {
    const { generateFiles } = await import("../../src/commands/scaffold/package/index.js");
    await generateFiles(
      { name: "my-renderer", gwenVersion: "^0.2.0", type: "renderer", withCi: false, withDocs: false },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-renderer");
    const pkg = JSON.parse(await fs.readFile(path.join(out, "package.json"), "utf8"));
    expect(pkg.dependencies["@gwenjs/renderer-core"]).toBe("^0.2.0");
  });

  it("standard mode does not generate renderer-service.ts or conformance test", async () => {
    const { generateFiles } = await import("../../src/commands/scaffold/package/index.js");
    await generateFiles(
      { name: "my-plugin", gwenVersion: "^0.1.0", type: "standard", withCi: false, withDocs: false },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-plugin");
    expect(await fileExists(path.join(out, "src/renderer-service.ts"))).toBe(false);
    expect(await fileExists(path.join(out, "tests/conformance.test.ts"))).toBe(false);
  });

  it("standard mode package.json does not include @gwenjs/renderer-core", async () => {
    const { generateFiles } = await import("../../src/commands/scaffold/package/index.js");
    await generateFiles(
      { name: "my-plugin", gwenVersion: "^0.1.0", type: "standard", withCi: false, withDocs: false },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-plugin");
    const pkg = JSON.parse(await fs.readFile(path.join(out, "package.json"), "utf8"));
    expect(pkg.dependencies["@gwenjs/renderer-core"]).toBeUndefined();
  });
});
