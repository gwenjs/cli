# gwen preview

Preview the production build locally. Run `gwen build` first to generate the output directory.

## Usage

```bash
gwen preview [options]
```

## Options

| Option   | Alias | Type   | Default | Description                      |
| -------- | ----- | ------ | ------- | -------------------------------- |
| `--port` | `-p`  | string | `4173`  | Preview server port (1024–65535) |

## Global Options

| Option      | Alias | Type    | Description            |
| ----------- | ----- | ------- | ---------------------- |
| `--verbose` | `-v`  | boolean | Show detailed logs     |
| `--debug`   |       | boolean | Show debug information |

## Examples

```bash
# Preview on default port 4173
gwen preview

# Preview on a custom port
gwen preview --port 8080
gwen preview -p 8080
```

## Notes

- Port must be an integer between 1024 and 65535. An invalid port exits with code 2.
- Run `gwen build` before `gwen preview` to generate the `dist/` output.
