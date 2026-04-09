# gwen scaffold

Scaffold a community plugin package for the GWEN ecosystem.

## Subcommands

| Subcommand                                        | Description                         |
| ------------------------------------------------- | ----------------------------------- |
| [`gwen scaffold package`](#gwen-scaffold-package) | Generate a community plugin package |

---

## gwen scaffold package

Generate a complete community plugin package in a new `<name>/` directory. Includes TypeScript config, Vite build setup, plugin factory, composable, type augmentation, and build-time module.

Use `--renderer` (or select **Renderer package** interactively) to generate renderer-specific templates that implement the `RendererService` contract from `@gwenjs/renderer-core`.

### Usage

```bash
gwen scaffold package [name] [options]
```

### Arguments

| Argument | Required | Description                                      |
| -------- | -------- | ------------------------------------------------ |
| `name`   | No       | Package name in kebab-case (prompted if omitted) |

### Options

| Option           | Type    | Default  | Description                                                    |
| ---------------- | ------- | -------- | -------------------------------------------------------------- |
| `--scope`        | string  | —        | npm scope for the generated package (e.g. `myorg` or `@myorg`) |
| `--renderer`     | boolean | prompted | Scaffold a renderer package (Canvas, WebGL, Three.js, etc.)    |
| `--gwen-version` | string  | `^0.1.0` | GWEN peer dependency version range                             |
| `--with-ci`      | boolean | prompted | Include GitHub Actions CI + publish workflows                  |
| `--with-docs`    | boolean | prompted | Include VitePress documentation                                |

### Standard Package Structure

```
<name>/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.ts
    ├── types.ts
    ├── plugin.ts
    ├── composables.ts
    ├── augment.ts
    └── module.ts
```

### Renderer Package Structure

Generated when `--renderer` is passed or **Renderer package** is selected interactively.

```
<name>/
├── package.json              ← includes @gwenjs/renderer-core
├── tsconfig.json
├── vite.config.ts
├── tests/
│   └── conformance.test.ts   ← validates the RendererService contract
└── src/
    ├── index.ts
    ├── types.ts              ← RendererOptions with layers
    ├── renderer-service.ts   ← defineRendererService stub
    ├── plugin.ts             ← getOrCreateLayerManager wiring
    ├── composables.ts        ← useMyRenderer() composable
    ├── augment.ts            ← GwenProvides augmentation
    └── module.ts             ← defineGwenModule entry point
```

### Examples

```bash
# Standard package (interactive type selection)
gwen scaffold package my-plugin

# Renderer package via flag (no prompt)
gwen scaffold package my-renderer --renderer

# With CI and docs
gwen scaffold package my-plugin --with-ci --with-docs

# Pin GWEN version
gwen scaffold package my-plugin --gwen-version "^0.2.0"

# Generate a scoped package
gwen scaffold package my-plugin --scope myorg
# → creates @myorg/gwen-my-plugin
```

### Next steps after scaffolding a renderer

1. `cd <name> && pnpm install`
2. Implement `mount`, `unmount`, `resize`, `flush` in `src/renderer-service.ts`
3. Run `pnpm test` — the conformance suite must pass before publishing
4. Register in `gwen.config.ts`:

```ts
import { defineConfig } from "@gwenjs/app";

export default defineConfig({
  modules: [
    [
      "@<scope>/gwen-<name>",
      {
        layers: {
          background: { order: 0 },
          game: { order: 10 },
        },
      },
    ],
  ],
});
```
