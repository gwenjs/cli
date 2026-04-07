# gwen build

Build the project for production. Compiles TypeScript, bundles assets, and includes WASM support.

## Usage

```bash
gwen build [options]
```

## Options

| Option      | Alias | Type    | Default   | Description                          |
| ----------- | ----- | ------- | --------- | ------------------------------------ |
| `--mode`    |       | string  | `release` | Build mode: `release` or `debug`     |
| `--out-dir` | `-o`  | string  | `dist`    | Output directory                     |
| `--dry-run` |       | boolean | `false`   | Simulate build without writing files |

## Global Options

| Option      | Alias | Type    | Description            |
| ----------- | ----- | ------- | ---------------------- |
| `--verbose` | `-v`  | boolean | Show detailed logs     |
| `--debug`   |       | boolean | Show debug information |

## Examples

```bash
# Production build (default)
gwen build

# Debug build
gwen build --mode debug

# Custom output directory
gwen build --out-dir public

# Dry run — no files written, useful for CI validation
gwen build --dry-run --verbose
```

## Notes

- Build errors are printed to stderr and the process exits with code 3.
- `--dry-run` is useful for CI validation without side effects.
