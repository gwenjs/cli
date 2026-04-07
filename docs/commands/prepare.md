# gwen prepare

Generate the `.gwen/` directory containing TypeScript configuration and type definitions for your project. Run this after changing `gwen.config.ts`.

## Usage

```bash
gwen prepare [options]
```

## Options

| Option     | Type    | Description                                                    |
| ---------- | ------- | -------------------------------------------------------------- |
| `--strict` | boolean | **Deprecated.** Hard-fail on module errors is now the default. |

## Global Options

| Option      | Alias | Type    | Description            |
| ----------- | ----- | ------- | ---------------------- |
| `--verbose` | `-v`  | boolean | Show detailed logs     |
| `--debug`   |       | boolean | Show debug information |

## Generated Files

```
.gwen/
├── tsconfig.json
└── types/
    └── (generated type definitions)
```

## Examples

```bash
# Generate .gwen/ files
gwen prepare

# With detailed output
gwen prepare --verbose
```

## Notes

- Errors during generation are printed and the process exits with code 4.
- Run `gwen prepare` after every change to `gwen.config.ts`.

::: warning Deprecated option
`--strict` is deprecated. Hard-fail on module errors is the default behavior since 0.1.0. The flag is accepted but ignored.
:::
