# gwen info

Display the parsed `gwen.config.ts` as JSON on stdout. Useful for debugging configuration issues or piping into `jq`.

## Usage

```bash
gwen info [options]
```

## Global Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed logs |
| `--debug` | | boolean | Show debug information |

## Examples

```bash
# Print the full parsed config
gwen info

# Inspect a specific field with jq
gwen info | jq '.engine'
gwen info | jq '.modules'
```

## Notes

- Exits with code 4 if `gwen.config.ts` is not found or cannot be parsed.
- Output is valid JSON on stdout; diagnostic logs go to stderr.
