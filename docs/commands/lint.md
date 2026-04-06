# gwen lint

Lint source code using [oxlint](https://oxc.rs/docs/guide/usage/linter).

## Usage

```bash
gwen lint [options]
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--fix` | boolean | `false` | Auto-fix lint errors |
| `--path` | string | `src` | Path to lint |

## Global Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed logs |
| `--debug` | | boolean | Show debug information |

## Examples

```bash
# Lint src/
gwen lint

# Lint and auto-fix
gwen lint --fix

# Lint a specific directory
gwen lint --path src/systems
```
