# Commands

Complete reference for all `gwen` CLI commands.

## Global Options

Available on every command:

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Show detailed logs |
| `--debug` | | boolean | Show debug information (very verbose) |

## All Commands

| Command | Description |
|---------|-------------|
| [`gwen init`](./init) | Scaffold a new GWEN game project |
| [`gwen dev`](./dev) | Start development server with hot reload |
| [`gwen build`](./build) | Build project for production |
| [`gwen prepare`](./prepare) | Generate `.gwen/` directory (tsconfig + types) |
| [`gwen preview`](./preview) | Preview the production build locally |
| [`gwen add`](./add) | Install and register a GWEN module |
| [`gwen scaffold`](./scaffold) | Scaffold artefacts (plugin, module, package) |
| [`gwen lint`](./lint) | Lint source code with oxlint |
| [`gwen format`](./format) | Format source code with oxfmt |
| [`gwen info`](./info) | Show parsed `gwen.config.ts` as JSON |
| [`gwen doctor`](./doctor) | Run project health checks |
