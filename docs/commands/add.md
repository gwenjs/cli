# gwen add

Install a GWEN module package using the project's package manager, then automatically register it in `gwen.config.ts`.

## Usage

```bash
gwen add <module> [options]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `module` | ✅ | Module package name (e.g. `@gwenjs/physics2d`) |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dev` | boolean | `false` | Install as a `devDependency` |

## Examples

```bash
# Install a runtime module
gwen add @gwenjs/physics2d

# Install as devDependency
gwen add @gwenjs/debug --dev
```

## Notes

- The package manager is auto-detected (npm / pnpm / yarn / bun).
- The module is appended to the `modules` array in `gwen.config.ts` automatically.
- Run `gwen prepare` after adding a module to regenerate `.gwen/` type definitions.
