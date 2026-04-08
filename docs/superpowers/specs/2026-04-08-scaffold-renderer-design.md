# Design — `gwen scaffold package` renderer mode

**Date:** 2026-04-08  
**Status:** Approved

---

## Problem

The `gwen scaffold` command currently exposes three subcommands: `plugin`, `module`, and `package`. The `plugin` and `module` subcommands generate minimal in-project stubs, but these are rarely used and clutter the CLI surface. Meanwhile, `scaffold package` is the valuable one — it generates standalone community packages. A new GWEN feature (the renderer system) requires a dedicated scaffold mode that pre-fills the correct contracts (`defineRendererService`, `getOrCreateLayerManager`, conformance tests) instead of leaving users to read the full guide before writing any code.

---

## Scope

- Remove `gwen scaffold plugin` and `gwen scaffold module` (commands + source files + tests + docs)
- Add `type: 'standard' | 'renderer'` to `ScaffoldPackageOptions`
- Add `--renderer` flag to `gwen scaffold package`
- Add interactive arrow-key selection when `--renderer` is not passed
- Generate renderer-specific templates when type is `renderer`
- Add `@gwenjs/renderer-core` to `package.json` in renderer mode
- Add `tests/conformance.test.ts` in renderer mode
- Update VitePress docs (EN + FR)

---

## Architecture

### 1. Remove scaffold plugin and module

Delete:
- `src/commands/scaffold/plugin.ts`
- `src/commands/scaffold/module.ts`

Update `src/commands/scaffold/index.ts` to only expose `package`:

```ts
export default defineCommand({
  meta: { name: "scaffold", description: "Scaffold a community plugin package" },
  subCommands: { package: scaffoldPackageCommand },
})
```

### 2. `promptSelect` utility

Add `promptSelect<T>(label, choices)` to `src/utils/prompt.ts`. Uses raw TTY mode to capture arrow keys and Enter — renders a live list with a `❯` cursor.

```ts
export async function promptSelect<T extends string>(
  label: string,
  choices: { label: string; value: T }[],
): Promise<T>
```

Behaviour:
- Renders `label` above the list
- `↑`/`↓` arrows move cursor, `Enter` confirms
- Works when stdin is a TTY; if not a TTY (CI/pipe) it returns the first choice as default

### 3. `ScaffoldPackageOptions` update

```ts
export type PackageType = 'standard' | 'renderer'

export interface ScaffoldPackageOptions {
  name: string
  gwenVersion: string
  type: PackageType   // new
  withCi: boolean
  withDocs: boolean
}
```

`resolveOptions` logic:
1. Prompt for name if not provided (unchanged)
2. If `--renderer` flag is passed → `type = 'renderer'` (no prompt)
3. Otherwise → `promptSelect("Package type", [{ label: "Standard package", value: "standard" }, { label: "Renderer package", value: "renderer" }])`
4. `withCi` and `withDocs` prompts unchanged

### 4. `templates/renderer.ts`

New file containing renderer-specific template factories, each taking `name: string`:

| Export | Generated file | Content |
|---|---|---|
| `rendererTypesTemplate(name)` | `src/types.ts` | `RendererOptions` with `layers: Record<string, LayerDef>`, `container?: HTMLElement` |
| `rendererServiceTemplate(name)` | `src/renderer-service.ts` | `defineRendererService` stub with `createElement`, `mount`, `unmount`, `resize`, `flush` |
| `rendererPluginTemplate(name)` | `src/plugin.ts` | `definePlugin` using `getOrCreateLayerManager`, registers service, mounts on `engine.onStart` |
| `rendererComposablesTemplate(name)` | `src/composables.ts` | `useMyRenderer()` composable using `useService` + `onDestroy` |
| `rendererModuleTemplate(name)` | `src/module.ts` | `defineGwenModule` with `meta.configKey`, `defaults.layers`, `addPlugin`, `addAutoImports`, `addModuleAugment` |
| `rendererAugmentTemplate(name)` | `src/augment.ts` | `GwenProvides` augmentation with `renderer:<name>` key |
| `rendererIndexTemplate(name)` | `src/index.ts` | Re-exports all public symbols |
| `conformanceTestTemplate(name)` | `tests/conformance.test.ts` | `runConformanceTests` from `@gwenjs/renderer-core/testing` |

All template names (PascalCase export names, composable names) are derived from `name` using the existing `toPascalCase`/`toCamelCase` helpers. For example, `name = "my-renderer"` → export `MyRendererPlugin`, composable `useMyRenderer()`.

### 5. `package.json` in renderer mode

`buildPackageJson` gains a `type` parameter. When `type === 'renderer'`:

```json
{
  "dependencies": {
    "@gwenjs/core": "...",
    "@gwenjs/kit": "...",
    "@gwenjs/renderer-core": "<gwenVersion>"
  }
}
```

No other changes to the package.json structure.

### 6. `generateFiles` update

```ts
const isRenderer = opts.type === 'renderer'

const files = isRenderer
  ? [
      // renderer-specific files
      [outputDir + "/package.json", buildPackageJson(name, gwenVersion, withDocs, 'renderer')],
      [srcDir + "/types.ts", rendererTypesTemplate(name)],
      [srcDir + "/renderer-service.ts", rendererServiceTemplate(name)],
      [srcDir + "/plugin.ts", rendererPluginTemplate(name)],
      [srcDir + "/composables.ts", rendererComposablesTemplate(name)],
      [srcDir + "/module.ts", rendererModuleTemplate(name)],
      [srcDir + "/augment.ts", rendererAugmentTemplate(name)],
      [srcDir + "/index.ts", rendererIndexTemplate(name)],
      // conformance test
      [outputDir + "/tests/conformance.test.ts", conformanceTestTemplate(name)],
      // shared
      [outputDir + "/.gitignore", gitignoreTemplate()],
      [outputDir + "/tsconfig.json", tsconfigTemplate()],
      [outputDir + "/vite.config.ts", viteConfigTemplate()],
    ]
  : [
      // existing standard files unchanged
    ]
```

The `tests/` directory is created with `fs.mkdir` when in renderer mode.

### 7. `scaffoldPackageCommand` args update

Add `renderer` boolean arg:

```ts
args: {
  name: { type: "positional", required: false, description: "Package name" },
  renderer: { type: "boolean", description: "Scaffold a renderer package" },
  "gwen-version": { type: "string", default: "^0.1.0" },
  "with-ci": { type: "boolean" },
  "with-docs": { type: "boolean" },
}
```

Success message updated to show the type:

```
✓ Renderer package scaffolded at my-renderer/
✓ Standard package scaffolded at my-plugin/
```

---

## Documentation

### EN `docs/commands/scaffold.md`

- Remove `gwen scaffold plugin` and `gwen scaffold module` sections + subcommands table entries
- Update `gwen scaffold package` section:
  - Add `--renderer` to options table
  - Add "Standard structure" vs "Renderer structure" generated file trees
  - Add renderer usage examples
  - Add note: "Use `--renderer` when building a GWEN renderer plugin (Canvas, WebGL, Three.js…)"

### FR `docs/fr/commands/scaffold.md`

Same changes in French.

---

## Testing

### Unit tests to add/update (`tests/unit/scaffold-package.test.ts` or equivalent)

- `resolveOptions` with `--renderer` flag → `type === 'renderer'` without prompt
- `resolveOptions` without flag → defaults to `'standard'` (mock `promptSelect`)
- Each renderer template function: content assertions (key exports, imports from `@gwenjs/renderer-core`, composable name matches package name)
- `buildPackageJson` with `type === 'renderer'` includes `@gwenjs/renderer-core` dep
- `generateFiles` renderer mode: `renderer-service.ts` and `tests/conformance.test.ts` are written; `src/plugin.ts` does not exist as standard (i.e., renderer plugin differs)
- `generateFiles` standard mode: unchanged behaviour, no `renderer-service.ts`

### Tests to remove

- All `scaffoldPluginCommand` tests
- All `scaffoldModuleCommand` tests

---

## Non-goals

- No interactive renderer tech selection (Canvas / WebGL / Three.js) — the stub is tech-agnostic
- No change to `--with-ci` or `--with-docs` behaviour
- No change to how standard packages are generated (backward compatible)
