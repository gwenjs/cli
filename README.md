# @gwenjs/cli

> Command Line Interface for the [GWEN Game Engine](https://github.com/gwenjs)

[![CI](https://github.com/gwenjs/cli/actions/workflows/ci.yml/badge.svg)](https://github.com/gwenjs/cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@gwenjs/cli)](https://www.npmjs.com/package/@gwenjs/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)

## Installation

```bash
npm install -g @gwenjs/cli
# or
pnpm add -g @gwenjs/cli
```

## Usage

```bash
gwen [command] [options]
```

### Global options

| Option | Alias | Description |
|--------|-------|-------------|
| `--verbose` | `-v` | Show detailed logs |
| `--debug` | | Show debug information (very verbose) |

## Commands

| Command | Description |
|---------|-------------|
| `gwen init [name]` | Scaffold a new GWEN game project |
| `gwen dev` | Start development server with hot reload |
| `gwen build` | Build project for production |
| `gwen prepare` | Generate `.gwen/` (tsconfig + types) |
| `gwen preview` | Preview the production build locally |
| `gwen add <module>` | Install and register a GWEN module |
| `gwen scaffold` | Scaffold artefacts (plugin, module, package) |
| `gwen lint` | Lint source code with oxlint |
| `gwen format` | Format source code with oxfmt |
| `gwen info` | Show parsed `gwen.config.ts` as JSON |
| `gwen doctor` | Run project health checks |

📖 **Full reference:** [gwenjs.github.io/cli](https://gwenjs.github.io/cli)

## Quick start

```bash
# Create a new project
gwen init my-game

# Enter the project
cd my-game
pnpm install

# Generate types
gwen prepare

# Start the dev server
gwen dev
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Docs (dev server)
pnpm docs:dev
```

## License

MIT
