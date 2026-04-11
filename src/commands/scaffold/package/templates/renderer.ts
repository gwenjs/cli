/**
 * Renderer-specific scaffold template factories for `gwen scaffold package --renderer`.
 *
 * Each factory returns the source string for one file in the scaffolded renderer package.
 * All names are derived from the package name via toPascalCase/toCamelCase helpers.
 */

import { genExport, genImport, genInterface, genTypeImport } from "knitwork";
import { toPascalCase, toCamelCase, toPackageName } from "./base.js";
import { codeTemplate, type GeneratedTemplate } from "./render.js";

const knitworkOptions = { singleQuotes: true } as const;

function statement(line: string): string {
  // Knitwork helpers emit semicolons; the scaffold templates keep statements bare.
  return line.replace(/;$/, "");
}

function renderServiceInterface(name: string): string {
  return `export interface ${name} {\n  // TODO: expose public methods your composables need\n}`;
}

function renderStringKeyInterface(name: string, key: string, value: string): string {
  return statement(genInterface(name, { [key]: value })).replace(`"${key}"`, `'${key}'`);
}

/**
 * Generates `src/types.ts` for a renderer package.
 *
 * Exports the options interface (with layers) and a service interface stub.
 *
 * @param name - The package name in kebab-case (e.g. "my-renderer").
 * @param scope - Optional npm scope without `@`
 */
export function rendererTypesTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * Public types for ${pkg}.`,
      " */",
      "",
      statement(genTypeImport("@gwenjs/renderer-core", ["LayerDef"], knitworkOptions)),
      "",
      `/** Options accepted by the ${Pascal} module in gwen.config.ts. */`,
      `export interface ${Pascal}Options {`,
      "  /** Named canvas/div layers managed by this renderer. */",
      "  layers: Record<string, LayerDef>",
      "  /** DOM container to mount layers into. Defaults to document.body. */",
      "  container?: HTMLElement",
      "}",
      "",
      `/** Public API exposed via engine.provide('renderer:${name}'). */`,
      renderServiceInterface(`${Pascal}Service`),
    ].join("\n"),
  );
}

/**
 * Generates `src/renderer-service.ts` for a renderer package.
 *
 * Contains the `defineRendererService` stub implementing all required contract members.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function rendererServiceTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * Renderer service implementation for ${pkg}.`,
      " *",
      " * Implements the RendererService contract from @gwenjs/renderer-core.",
      " * All members are required — see the contract interface for details.",
      " */",
      "",
      statement(genImport("@gwenjs/renderer-core", ["defineRendererService"], knitworkOptions)),
      statement(genTypeImport("./types.js", [`${Pascal}Options`], knitworkOptions)),
      "",
      `export const ${Pascal}RendererService = defineRendererService<${Pascal}Options>((opts) => ({`,
      `  name: 'renderer:${name}',`,
      "  layers: opts.layers,",
      "",
      "  // Called once per declared layer — the result is cached automatically.",
      "  createElement(_layerName: string): HTMLElement {",
      "    return document.createElement('canvas')",
      "  },",
      "",
      "  // Called once after all layers are created and appended to the DOM.",
      "  mount(_ctx: { getLayer: (name: string) => HTMLElement }): void {",
      "    // TODO: initialise your rendering engine here",
      "  },",
      "",
      "  // Called when the scene is destroyed — release all GPU/DOM resources.",
      "  unmount(): void {",
      "    // TODO: dispose your rendering engine here",
      "  },",
      "",
      "  // Called on every viewport resize.",
      "  resize(_w: number, _h: number): void {",
      "    // TODO: resize your rendering engine",
      "  },",
      "",
      "  // Called each frame — run your render pass and report frame time.",
      "  flush({ reportFrameTime }: { reportFrameTime: (ms: number) => void }): void {",
      "    const t = performance.now()",
      "    // TODO: render one frame",
      "    reportFrameTime(performance.now() - t)",
      "  },",
      "}))",
    ].join("\n"),
  );
}

/**
 * Generates `src/plugin.ts` for a renderer package.
 *
 * Wires the renderer service into the GWEN engine via `getOrCreateLayerManager`.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function rendererPluginTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * GWEN plugin for ${pkg}.`,
      " *",
      " * Registers the renderer service and mounts layers on engine start.",
      " */",
      "",
      statement(genImport("@gwenjs/kit", ["definePlugin"], knitworkOptions)),
      statement(
        genImport("@gwenjs/renderer-core", ["getOrCreateLayerManager"], knitworkOptions),
      ),
      statement(genImport("./renderer-service.js", [`${Pascal}RendererService`], knitworkOptions)),
      statement(genTypeImport("./types.js", [`${Pascal}Options`], knitworkOptions)),
      "",
      `export const ${Pascal}Plugin = definePlugin<${Pascal}Options>((opts) => {`,
      `  const service = ${Pascal}RendererService({ layers: opts.layers })`,
      "",
      "  return {",
      `    name: 'renderer:${name}',`,
      "",
      "    setup(engine) {",
      `      engine.provide('renderer:${name}', service)`,
      "",
      "      const manager = getOrCreateLayerManager(engine, opts.container ?? document.body)",
      "      if (import.meta.env.DEV || engine.debug) {",
      "        manager.enableStats()",
      "      }",
      "      manager.register(service)",
      "",
      "      engine.onStart(() => manager.mount())",
      `      engine.onDestroy(() => manager.unregister('renderer:${name}'))`,
      "    },",
      "",
      "    onRender() {",
      "      service.flush({ reportFrameTime: () => {} })",
      "    },",
      "  }",
      "})",
    ].join("\n"),
  );
}

/**
 * Generates `src/composables.ts` for a renderer package.
 *
 * Exposes a composable that retrieves the renderer service inside an actor.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function rendererComposablesTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * Composables for ${pkg}.`,
      " *",
      " * Must be called inside defineActor() — lifecycle hooks are registered automatically.",
      " */",
      "",
      statement(genImport("@gwenjs/core/actor", ["onDestroy"], knitworkOptions)),
      statement(genImport("@gwenjs/core/system", ["useService"], knitworkOptions)),
      statement(genTypeImport("./types.js", [`${Pascal}Service`], knitworkOptions)),
      statement(genImport("./augment.js", undefined, knitworkOptions)),
      "",
      "/**",
      ` * Retrieves the ${Pascal} renderer service registered by ${Pascal}Plugin.`,
      " *",
      " * Call inside defineActor() to access the renderer for this actor's lifetime.",
      " * Resources registered via onDestroy are cleaned up automatically.",
      " *",
      " * @example",
      " * ```ts",
      " * export const MyActor = defineActor(MyPrefab, () => {",
      ` *   const ${camel} = use${Pascal}()`,
      ` *   onUpdate(() => console.log('${camel} ready'))`,
      " * })",
      " * ```",
      " */",
      `export function use${Pascal}(): ${Pascal}Service {`,
      `  const service = useService('renderer:${name}') as ${Pascal}Service`,
      "",
      "  onDestroy(() => {",
      "    // TODO: release any per-actor resources created from this service",
      "  })",
      "",
      "  return service",
      "}",
    ].join("\n"),
  );
}

/**
 * Generates `src/module.ts` for a renderer package.
 *
 * Provides the build-time GWEN module that wires the plugin and auto-imports.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function rendererModuleTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const pkg = toPackageName(name, scope);
  const serviceTypeImport = statement(genTypeImport(pkg, [`${Pascal}Service`], knitworkOptions));

  return codeTemplate(
    [
      "/**",
      ` * Build-time GWEN module for ${pkg}.`,
      " *",
      " * Add to gwen.config.ts:",
      ` *   modules: [['${pkg}', { layers: { main: { order: 0 } } }]]`,
      " *",
      " * IMPORTANT: Never import from './index.js' here — always import from './plugin.js'.",
      " */",
      "",
      statement(
        genImport("@gwenjs/kit", ["defineGwenModule", "definePluginTypes"], knitworkOptions),
      ),
      statement(genTypeImport("./types.js", [`${Pascal}Options`], knitworkOptions)),
      "",
      `export default defineGwenModule<${Pascal}Options>({`,
      "  meta: {",
      `    name: '${pkg}',`,
      `    configKey: '${camel}',`,
      "  },",
      "  defaults: {",
      "    layers: { main: { order: 0 } },",
      "  },",
      "  async setup(options, kit) {",
      `    const { ${Pascal}Plugin } = await import('./plugin.js')`,
      "",
      `    kit.addPlugin(${Pascal}Plugin(options))`,
      "",
      "    kit.addAutoImports([",
      `      { name: 'use${Pascal}', from: '${pkg}' },`,
      "    ])",
      "",
      "    kit.addTypeTemplate({",
      `      filename: '${name}.d.ts',`,
      "      getContents: () =>",
      "        definePluginTypes({",
      `          imports: ["${serviceTypeImport}"],`,
      `          provides: { 'renderer:${name}': '${Pascal}Service' },`,
      "        }),",
      "    })",
      "  },",
      "})",
    ].join("\n"),
  );
}

/**
 * Generates `src/augment.ts` for a renderer package.
 *
 * Declaration-merges `GwenProvides` so `useService('renderer:<name>')` is typed.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function rendererAugmentTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  const providesInterface = renderStringKeyInterface(
    "GwenProvides",
    `renderer:${name}`,
    `${Pascal}Service`,
  ).replaceAll("\n", "\n  ");

  return codeTemplate(
    [
      "/**",
      ` * Declaration merging — types useService('renderer:${name}') as ${Pascal}Service.`,
      ` * Activated as a side-effect when importing from '${pkg}'.`,
      " */",
      "",
      statement(genTypeImport("./types.js", [`${Pascal}Service`], knitworkOptions)),
      "",
      "declare module '@gwenjs/core' {",
      `  ${providesInterface}`,
      "}",
      "",
      "export {}",
    ].join("\n"),
  );
}

/**
 * Generates `src/index.ts` for a renderer package.
 *
 * Re-exports the public API: plugin factory, composables, and types.
 * The module entry point is exposed via the './module' package export, not here.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function rendererIndexTemplate(name: string, _scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  return codeTemplate(
    [
      `// Side-effect: activates typed useService('renderer:${name}') in manual mode`,
      statement(genImport("./augment.js", undefined, knitworkOptions)),
      "",
      "// Plugin factory — for manual registration in plugins: []",
      statement(genExport("./plugin.js", [`${Pascal}Plugin`], knitworkOptions)),
      "",
      `// Composables — use${Pascal}() for runtime access inside defineActor()`,
      statement(genExport("./composables.js", [`use${Pascal}`], knitworkOptions)),
      "",
      "// Public types",
      `export type { ${Pascal}Options, ${Pascal}Service } from './types.js'`,
      "",
      "// The build-time module is exposed via the './module' package export.",
      "// Do NOT re-export it here — that creates a circular dependency.",
    ].join("\n"),
  );
}

/**
 * Generates `tests/conformance.test.ts` for a renderer package.
 *
 * Runs the @gwenjs/renderer-core conformance suite against the service implementation.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 */
export function conformanceTestTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * Conformance test — verifies ${pkg} satisfies the RendererService contract.`,
      " *",
      " * Run: pnpm test",
      " */",
      "",
      statement(genImport("vitest", ["describe", "it", "expect"], knitworkOptions)),
      statement(
        genImport("@gwenjs/renderer-core/testing", ["runConformanceTests"], knitworkOptions),
      ),
      statement(
        genImport("../src/renderer-service.js", [`${Pascal}RendererService`], knitworkOptions),
      ),
      "",
      `describe('${pkg} conformance', () => {`,
      "  it('satisfies the RendererService contract', () => {",
      `    const service = ${Pascal}RendererService({ layers: { main: { order: 0 } } })`,
      "    expect(() => runConformanceTests(service)).not.toThrow()",
      "  })",
      "})",
    ].join("\n"),
  );
}
