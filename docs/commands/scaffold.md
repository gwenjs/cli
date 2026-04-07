# gwen scaffold

Scaffold artefacts for a GWEN project: runtime plugins, build-time modules, or complete community plugin packages.

## Subcommands

| Subcommand                                        | Description                              |
| ------------------------------------------------- | ---------------------------------------- |
| [`gwen scaffold plugin`](#gwen-scaffold-plugin)   | Generate a runtime plugin stub           |
| [`gwen scaffold module`](#gwen-scaffold-module)   | Generate a build-time module stub        |
| [`gwen scaffold package`](#gwen-scaffold-package) | Generate a full community plugin package |

---

## gwen scaffold plugin

Generate a runtime plugin stub at `src/plugins/<name>/index.ts`.

### Usage

```bash
gwen scaffold plugin [name]
```

### Arguments

| Argument | Required | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `name`   | No       | Plugin name in kebab-case (prompted if omitted) |

### Example

```bash
gwen scaffold plugin my-renderer
# → src/plugins/my-renderer/index.ts
```

---

## gwen scaffold module

Generate a build-time module stub at `src/modules/<name>/index.ts`.

### Usage

```bash
gwen scaffold module [name]
```

### Arguments

| Argument | Required | Description                                     |
| -------- | -------- | ----------------------------------------------- |
| `name`   | No       | Module name in kebab-case (prompted if omitted) |

### Example

```bash
gwen scaffold module my-module
# → src/modules/my-module/index.ts
```

---

## gwen scaffold package

Generate a complete community plugin package in a new `<name>/` directory. Includes TypeScript config, Vite config, plugin factory, composable, type augmentation, and build-time module.

### Usage

```bash
gwen scaffold package [name] [options]
```

### Arguments

| Argument | Required | Description                                      |
| -------- | -------- | ------------------------------------------------ |
| `name`   | No       | Package name in kebab-case (prompted if omitted) |

### Options

| Option           | Type   | Default  | Description                        |
| ---------------- | ------ | -------- | ---------------------------------- |
| `--gwen-version` | string | `^0.1.0` | GWEN peer dependency version range |

### Generated Structure

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

### Examples

```bash
gwen scaffold package my-plugin
# → my-plugin/

gwen scaffold package my-plugin --gwen-version "^0.2.0"
```
