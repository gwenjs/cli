/**
 * Tests for `gwen scaffold package` — verifies templates produce correct
 * file content and the full scaffold generates the expected file tree.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import {
  toPascalCase,
  toCamelCase,
  toPackageName,
  packageJsonTemplate,
  tsconfigTemplate,
  tsconfigTestTemplate,
  viteConfigTemplate,
  vitestConfigTemplate,
  testFileTemplate,
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
import { promptSelect, promptString } from "../../src/utils/prompt.js";
import { scaffoldPackageCommand } from "../../src/commands/scaffold/package/index.js";
import { logger } from "../../src/utils/logger.js";
import scaffoldCommand from "../../src/commands/scaffold/index.js";
import { normalizeScope, isValidScope } from "../../src/utils/validation.js";

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

describe("toPackageName", () => {
  it("returns scoped name when scope is provided", () => {
    expect(toPackageName("my-plugin", "monorg")).toBe("@monorg/my-plugin");
  });
  it("returns unscoped name when scope is undefined", () => {
    expect(toPackageName("my-plugin")).toBe("my-plugin");
  });
  it("returns unscoped name when scope is empty string", () => {
    expect(toPackageName("audio", "")).toBe("audio");
  });
});

describe("normalizeScope", () => {
  it("returns undefined for empty string", () => {
    expect(normalizeScope("")).toBeUndefined();
  });
  it("returns undefined for whitespace-only string", () => {
    expect(normalizeScope("   ")).toBeUndefined();
  });
  it("strips leading @ and trims", () => {
    expect(normalizeScope("@monorg")).toBe("monorg");
  });
  it("lowercases the scope", () => {
    expect(normalizeScope("MonOrg")).toBe("monorg");
  });
  it("strips @ and lowercases together", () => {
    expect(normalizeScope("  @MonOrg  ")).toBe("monorg");
  });
  it("returns the scope as-is when no @ prefix", () => {
    expect(normalizeScope("monorg")).toBe("monorg");
  });
});

describe("isValidScope", () => {
  it("accepts lowercase letters", () => {
    expect(isValidScope("monorg")).toBe(true);
  });
  it("accepts digits", () => {
    expect(isValidScope("org42")).toBe(true);
  });
  it("accepts hyphens and underscores", () => {
    expect(isValidScope("my-org_1")).toBe(true);
  });
  it("rejects uppercase letters", () => {
    expect(isValidScope("MonOrg")).toBe(false);
  });
  it("rejects spaces", () => {
    expect(isValidScope("my org")).toBe(false);
  });
  it("rejects special characters", () => {
    expect(isValidScope("my@org")).toBe(false);
  });
  it("rejects empty string", () => {
    expect(isValidScope("")).toBe(false);
  });
  it("rejects scopes longer than 214 chars", () => {
    expect(isValidScope("a".repeat(215))).toBe(false);
  });
  it("accepts exactly 214 chars", () => {
    expect(isValidScope("a".repeat(214))).toBe(true);
  });
});

describe("packageJsonTemplate", () => {
  it("sets the correct package name without scope", () => {
    const pkg = JSON.parse(packageJsonTemplate("my-plugin", "^0.1.0"));
    expect(pkg.name).toBe("my-plugin");
  });

  it("sets scoped package name when scope is provided", () => {
    const pkg = JSON.parse(packageJsonTemplate("my-plugin", "^0.1.0", "monorg"));
    expect(pkg.name).toBe("@monorg/my-plugin");
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

  it("includes vitest in devDependencies", () => {
    const pkg = JSON.parse(packageJsonTemplate("my-plugin", "^0.1.0"));
    expect(pkg.devDependencies["vitest"]).toBeDefined();
  });

  it("includes test script", () => {
    const pkg = JSON.parse(packageJsonTemplate("my-plugin", "^0.1.0"));
    expect(pkg.scripts["test"]).toBeDefined();
    expect(pkg.scripts["test"]).toContain("vitest");
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
    expect(content).toContain("'audio': AudioService");
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
    expect(content).toContain("audio");
  });

  it("throws GwenPluginNotFoundError with scoped hint when scope provided", () => {
    const content = composablesTemplate("audio", "monorg");
    expect(content).toContain("@monorg/audio");
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
    expect(content).toContain("from: 'audio'");
  });

  it("registers the composable with scoped name when scope provided", () => {
    const content = moduleTemplate("audio", "monorg");
    expect(content).toContain("from: '@monorg/audio'");
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

describe("vitestConfigTemplate", () => {
  it("generates a vitest config file", () => {
    const content = vitestConfigTemplate();
    expect(content).toContain("defineConfig");
    expect(content).toContain("vitest/config");
  });

  it("references tsconfig.test.json for typecheck", () => {
    const content = vitestConfigTemplate();
    expect(content).toContain("tsconfig.test.json");
    expect(content).toContain("typecheck");
  });
});

describe("tsconfigTestTemplate", () => {
  it("extends the main tsconfig", () => {
    const content = tsconfigTestTemplate();
    const parsed = JSON.parse(content);
    expect(parsed.extends).toBe("./tsconfig.json");
  });

  it("includes tests directory", () => {
    const content = tsconfigTestTemplate();
    const parsed = JSON.parse(content);
    expect(parsed.include).toContain("tests/**/*");
  });

  it("has noEmit set to true", () => {
    const content = tsconfigTestTemplate();
    const parsed = JSON.parse(content);
    expect(parsed.compilerOptions.noEmit).toBe(true);
  });
});

describe("testFileTemplate", () => {
  it("generates a basic test file", () => {
    const content = testFileTemplate("my-plugin");
    expect(content).toContain("describe");
    expect(content).toContain("my-plugin");
    expect(content).toContain("vitest");
  });
});

// ─── Integration test ─────────────────────────────────────────────────────────

import { generateFiles, buildPackageJson } from "../../src/commands/scaffold/package/index.js";

describe("buildPackageJson with scope", () => {
  it("passes scope to packageJsonTemplate", () => {
    const result = buildPackageJson("my-plugin", "^0.1.0", false, "standard", "monorg");
    expect(result).toContain("@monorg/my-plugin");
  });

  it("buildPackageJson without scope uses plain name", () => {
    const result = buildPackageJson("my-plugin", "^0.1.0", false, "standard");
    expect(result).toContain('"name": "my-plugin"');
  });
});

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

  describe("scope resolution", () => {
    it("normalizes scope from --scope flag (strips @)", async () => {
      const mockStdout = { isTTY: false, write: vi.fn() };
      vi.spyOn(process, "stdout", "get").mockReturnValue(mockStdout as any);
      const opts = await resolveOptions({
        name: "my-plugin",
        scope: "@monorg",
        "with-ci": false,
        "with-docs": false,
      });
      expect(opts.scope).toBe("monorg");
      vi.restoreAllMocks();
    });

    it("normalizes scope from --scope flag (lowercases)", async () => {
      const mockStdout = { isTTY: false, write: vi.fn() };
      vi.spyOn(process, "stdout", "get").mockReturnValue(mockStdout as any);
      const opts = await resolveOptions({
        name: "my-plugin",
        scope: "MYORG",
        "with-ci": false,
        "with-docs": false,
      });
      expect(opts.scope).toBe("myorg");
      vi.restoreAllMocks();
    });

    it("returns undefined scope when flag not provided in non-TTY", async () => {
      const mockStdout = { isTTY: false, write: vi.fn() };
      vi.spyOn(process, "stdout", "get").mockReturnValue(mockStdout as any);
      const opts = await resolveOptions({
        name: "my-plugin",
        "with-ci": false,
        "with-docs": false,
      });
      expect(opts.scope).toBeUndefined();
      vi.restoreAllMocks();
    });

    it("throws on invalid scope from flag", async () => {
      const mockStdout = { isTTY: false, write: vi.fn() };
      vi.spyOn(process, "stdout", "get").mockReturnValue(mockStdout as any);
      await expect(
        resolveOptions({
          name: "my-plugin",
          scope: "--invalid",
          "with-ci": false,
          "with-docs": false,
        }),
      ).rejects.toThrow(/invalid scope/i);
      vi.restoreAllMocks();
    });
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

  it("has separate lint and typescript jobs with ci-status gate", () => {
    const content = ciWorkflowTemplate();
    expect(content).toContain("name: Lint & Format");
    expect(content).toContain("name: TypeScript");
    expect(content).toContain("name: CI Status");
    expect(content).toContain("needs: [lint]");
    expect(content).toContain("needs: [lint, typescript]");
    expect(content).toContain("if: always()");
  });

  it("runs lint, format:check, typecheck, test, build steps", () => {
    const content = ciWorkflowTemplate();
    expect(content).toContain("pnpm lint");
    expect(content).toContain("pnpm format:check");
    expect(content).toContain("pnpm typecheck");
    expect(content).toContain("pnpm test");
    expect(content).toContain("pnpm build");
  });
});

describe("releaseWorkflowTemplate", () => {
  it("triggers on workflow_run CI completion", () => {
    const content = releaseWorkflowTemplate();
    expect(content).toContain('workflows: ["CI"]');
    expect(content).toContain("workflow_run");
    expect(content).toContain("workflow_run.conclusion == 'success'");
  });

  it("has separate release-please and publish jobs", () => {
    const content = releaseWorkflowTemplate();
    expect(content).toContain("name: Release Please");
    expect(content).toContain("name: Publish to npm");
    expect(content).toContain("needs: [release-please]");
    expect(content).toContain("releases_created");
    expect(content).toContain("RELEASE_PLEASE_TOKEN");
  });

  it("publishes to npm with provenance via OIDC", () => {
    const content = releaseWorkflowTemplate();
    expect(content).toContain("pnpm publish");
    expect(content).toContain("--provenance");
    expect(content).toContain("id-token: write");
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
    expect(content).toContain("my-plugin"); // no scope
  });

  it("includes scoped install command when scope provided", () => {
    const content = docsGettingStartedTemplate("my-plugin", "monorg");
    expect(content).toContain("@monorg/my-plugin");
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
    expect(src).toContain("my-renderer"); // no scope → no @community
  });

  it("registers composable with scoped name when scope provided", () => {
    const src = rendererModuleTemplate("my-renderer", "monorg");
    expect(src).toContain("@monorg/my-renderer");
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
      {
        name: "my-renderer",
        gwenVersion: "^0.1.0",
        type: "renderer",
        withCi: false,
        withDocs: false,
      },
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
      {
        name: "my-renderer",
        gwenVersion: "^0.2.0",
        type: "renderer",
        withCi: false,
        withDocs: false,
      },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-renderer");
    const pkg = JSON.parse(await fs.readFile(path.join(out, "package.json"), "utf8"));
    expect(pkg.dependencies["@gwenjs/renderer-core"]).toBe("^0.2.0");
  });

  it("standard mode does not generate renderer-service.ts or conformance test", async () => {
    const { generateFiles } = await import("../../src/commands/scaffold/package/index.js");
    await generateFiles(
      {
        name: "my-plugin",
        gwenVersion: "^0.1.0",
        type: "standard",
        withCi: false,
        withDocs: false,
      },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-plugin");
    expect(await fileExists(path.join(out, "src/renderer-service.ts"))).toBe(false);
    expect(await fileExists(path.join(out, "tests/conformance.test.ts"))).toBe(false);
  });

  it("standard mode package.json does not include @gwenjs/renderer-core", async () => {
    const { generateFiles } = await import("../../src/commands/scaffold/package/index.js");
    await generateFiles(
      {
        name: "my-plugin",
        gwenVersion: "^0.1.0",
        type: "standard",
        withCi: false,
        withDocs: false,
      },
      tmpDir,
    );
    const out = path.join(tmpDir, "my-plugin");
    const pkg = JSON.parse(await fs.readFile(path.join(out, "package.json"), "utf8"));
    expect(pkg.dependencies["@gwenjs/renderer-core"]).toBeUndefined();
  });
});

// ─── scaffoldPackageCommand run() handler ─────────────────────────────────────

describe("scaffoldPackageCommand run() handler", () => {
  let tmpDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let successSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gwen-run-"));
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    successSpy = vi.spyOn(logger, "success").mockImplementation(() => {});
    infoSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit");
    }) as never);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("logs success message for a standard package", async () => {
    await (scaffoldPackageCommand as any).run({
      args: { name: "my-pkg", renderer: false, "with-ci": false, "with-docs": false },
    });
    expect(successSpy).toHaveBeenCalledWith(
      expect.stringContaining("Package scaffolded at my-pkg/"),
    );
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("pnpm dev"));
  });

  it("logs success message for a renderer package", async () => {
    await (scaffoldPackageCommand as any).run({
      args: { name: "my-renderer", renderer: true, "with-ci": false, "with-docs": false },
    });
    expect(successSpy).toHaveBeenCalledWith(
      expect.stringContaining("Renderer package scaffolded at my-renderer/"),
    );
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("conformance suite"));
  });

  it("exits with validation error when name is invalid", async () => {
    await expect(
      (scaffoldPackageCommand as any).run({
        args: { name: "INVALID NAME", renderer: false, "with-ci": false, "with-docs": false },
      }),
    ).rejects.toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid package name"));
  });

  it("shows CI instructions when --with-ci is true", async () => {
    await (scaffoldPackageCommand as any).run({
      args: { name: "my-pkg", renderer: false, "with-ci": true, "with-docs": false },
    });
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("NPM_TOKEN"));
  });

  it("shows docs instructions when --with-docs is true", async () => {
    await (scaffoldPackageCommand as any).run({
      args: { name: "my-pkg", renderer: false, "with-ci": false, "with-docs": true },
    });
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("docs:dev"));
  });

  it("exits with error when name is empty after interactive prompt", async () => {
    // Make readline return empty string so resolveOptions ends up with name=""
    vi.mocked(readline.createInterface).mockImplementationOnce(
      () =>
        ({
          once: vi.fn((event: string, cb: (line: string) => void) => {
            if (event === "line") cb("");
          }),
          close: vi.fn(),
        }) as any,
    );
    await expect((scaffoldPackageCommand as any).run({ args: {} })).rejects.toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Package name cannot be empty"));
  });
});

// ─── promptString readline path ───────────────────────────────────────────────

describe("promptString — readline path", () => {
  it("resolves with trimmed input from readline", async () => {
    let lineCallback: ((line: string) => void) | undefined;
    const mockRl = {
      once: vi.fn((event: string, cb: (line: string) => void) => {
        if (event === "line") lineCallback = cb;
      }),
      close: vi.fn(),
    };
    const createInterfaceSpy = vi.spyOn(readline, "createInterface").mockReturnValue(mockRl as any);
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const promise = promptString("Enter name");
    lineCallback!("  test value  ");
    const result = await promise;

    expect(result).toBe("test value");
    expect(writeSpy).toHaveBeenCalledWith("Enter name: ");

    createInterfaceSpy.mockRestore();
    writeSpy.mockRestore();
  });
});

// ─── promptSelect TTY keyboard navigation ────────────────────────────────────

describe("promptSelect — TTY keyboard navigation", () => {
  const originalIsTTY = process.stdin.isTTY;

  beforeEach(() => {
    (process.stdin as any).isTTY = true;
    (process.stdin as any).setRawMode = vi.fn();
    vi.spyOn(process.stdin, "resume").mockImplementation(() => process.stdin);
    vi.spyOn(process.stdin, "pause").mockImplementation(() => process.stdin);
    vi.spyOn(process.stdin, "setEncoding").mockImplementation(() => process.stdin);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    (process.stdin as any).isTTY = originalIsTTY;
    vi.restoreAllMocks();
  });

  it("selects the first choice when Enter is pressed immediately", async () => {
    const choices = [
      { label: "Option A", value: "a" as const },
      { label: "Option B", value: "b" as const },
    ];
    const resultPromise = promptSelect("Pick", choices);
    process.stdin.emit("data", "\r");
    const result = await resultPromise;
    expect(result).toBe("a");
  });

  it("moves selection down with arrow-down then selects with Enter", async () => {
    const choices = [
      { label: "Option A", value: "a" as const },
      { label: "Option B", value: "b" as const },
    ];
    const resultPromise = promptSelect("Pick", choices);
    process.stdin.emit("data", "\u001b[B"); // arrow down
    process.stdin.emit("data", "\r");
    const result = await resultPromise;
    expect(result).toBe("b");
  });

  it("wraps around to last item when arrow-up is pressed at first item", async () => {
    const choices = [
      { label: "Option A", value: "a" as const },
      { label: "Option B", value: "b" as const },
    ];
    const resultPromise = promptSelect("Pick", choices);
    process.stdin.emit("data", "\u001b[A"); // arrow up (wraps to last)
    process.stdin.emit("data", "\r");
    const result = await resultPromise;
    expect(result).toBe("b");
  });

  it("selects with \\n as well as \\r", async () => {
    const choices = [{ label: "Only", value: "only" as const }];
    const resultPromise = promptSelect("Pick", choices);
    process.stdin.emit("data", "\n");
    const result = await resultPromise;
    expect(result).toBe("only");
  });

  it("calls process.exit(1) when Ctrl+C is pressed", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
    const choices = [
      { label: "Option A", value: "a" as const },
      { label: "Option B", value: "b" as const },
    ];
    promptSelect("Pick", choices);
    process.stdin.emit("data", "\u0003"); // Ctrl+C
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
