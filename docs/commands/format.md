# gwen format

Format source code using [oxfmt](https://oxc.rs).

## Usage

```bash
gwen format [options]
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--check` | boolean | `false` | Check formatting without writing files |
| `--path` | string | `src` | Path to format |

## Global Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed logs |
| `--debug` | | boolean | Show debug information |

## Examples

```bash
# Format src/
gwen format

# Check only — no files written (useful for CI)
gwen format --check

# Format a specific directory
gwen format --path src/systems
```

## Notes

- `--check` exits with a non-zero code if any file would be changed. Use it in CI pipelines to enforce formatting.
