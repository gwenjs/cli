# gwen dev

Start a development server with hot module reloading (HMR). Displays the GWEN ASCII banner on startup.

## Usage

```bash
gwen dev [options]
```

## Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--port` | `-p` | string | `3000` | HTTP server port (1024–65535) |
| `--open` | `-o` | boolean | `false` | Auto-open browser on start |

## Global Options

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed logs |
| `--debug` | | boolean | Show debug information |

## Examples

```bash
# Start on default port 3000
gwen dev

# Start on a custom port
gwen dev --port 3001
gwen dev -p 3001

# Start and open the browser automatically
gwen dev --open
gwen dev -o

# Custom port and auto-open
gwen dev -p 8080 -o
```

## Notes

- Port must be an integer between 1024 and 65535. An invalid port exits with code 2.
- The GWEN ASCII banner is printed before any log output.
