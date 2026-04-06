# Design Spec — VitePress CLI Documentation

**Date:** 2026-04-06  
**Project:** `@gwenjs/cli` — GWEN Game Engine CLI  
**Scope:** CLI command reference documentation  
**Audience:** Developers using GWEN to build games

---

## Problem Statement

The GWEN CLI (`gwen`) has 11 commands with no public documentation. Developers need a browsable, searchable reference that explains each command, its options, and usage examples. The documentation must be bilingual (English + French), with English as the default.

---

## Approach

A VitePress documentation site placed in `docs/` inside the existing `@gwenjs/cli` repo. One page per command, using VitePress i18n with English at the root (`/`) and French at `/fr/`.

---

## File Structure

```
docs/
├── .vitepress/
│   └── config.ts                # VitePress config: i18n, sidebar, theme
├── index.md                     # EN home (root locale)
├── commands/
│   ├── index.md                 # EN commands overview
│   ├── init.md
│   ├── dev.md
│   ├── build.md
│   ├── prepare.md
│   ├── preview.md
│   ├── add.md
│   ├── scaffold.md              # Covers scaffold plugin / module / package
│   ├── lint.md
│   ├── format.md
│   ├── info.md
│   └── doctor.md
├── fr/
│   ├── index.md                 # FR home
│   └── commands/
│       ├── index.md             # FR commands overview
│       ├── init.md
│       ├── dev.md
│       ├── build.md
│       ├── prepare.md
│       ├── preview.md
│       ├── add.md
│       ├── scaffold.md
│       ├── lint.md
│       ├── format.md
│       ├── info.md
│       └── doctor.md
└── package.json                 # docs-specific: vitepress + scripts
```

---

## VitePress Configuration

### i18n (locales)

| Locale | Root | Language | Label |
|--------|------|----------|-------|
| `root` | `/` | English | English |
| `fr`   | `/fr/` | French | Français |

English is the default locale (served at `/`). French is served at `/fr/`.

### Theme

- Default VitePress theme
- Accent color: GWEN violet `#9333ea` (matches the CLI's ASCII art banner)
- Dark mode enabled

### Sidebar

Both locales share the same structure, with translated labels:

```
Commands
  ├── Overview
  ├── init
  ├── dev
  ├── build
  ├── prepare
  ├── preview
  ├── add
  ├── scaffold
  ├── lint
  ├── format
  ├── info
  └── doctor
```

---

## Page Template (per command)

Each command page follows this structure:

```md
# gwen [command]

Short description (1-2 sentences).

## Usage
\`\`\`bash
gwen [command] [options]
\`\`\`

## Options
| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| ...    |       |      |         |             |

## Global Options
| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--verbose` | `-v` | boolean | false | Show detailed logs |
| `--debug` | | boolean | false | Show debug information |

## Examples
\`\`\`bash
gwen [command]
gwen [command] --option value
\`\`\`

## Notes
Special behaviors, common errors, tips.
```

All option data is extracted directly from the source code in `src/commands/`.

The `scaffold` page additionally documents the three sub-commands: `scaffold plugin`, `scaffold module`, `scaffold package`.

---

## Commands Inventory

| Command | Description | Key Options |
|---------|-------------|-------------|
| `init` | Scaffold a new GWEN project | `[name]`, `--modules` |
| `dev` | Start dev server with HMR | `--port/-p`, `--open/-o` |
| `build` | Production build (WASM + bundle) | `--mode`, `--out-dir/-o`, `--dry-run` |
| `prepare` | Generate `.gwen/` (tsconfig + types) | `--strict` (deprecated) |
| `preview` | Preview production build locally | `--port/-p` |
| `add` | Install & register a GWEN module | `<module>`, `--dev` |
| `scaffold plugin` | Generate a runtime plugin stub | `[name]` |
| `scaffold module` | Generate a build-time module stub | `[name]` |
| `scaffold package` | Generate a package stub | `[name]` |
| `lint` | Lint with oxlint | `--fix`, `--path` |
| `format` | Format with oxfmt | — |
| `info` | Show parsed `gwen.config.ts` as JSON | — |
| `doctor` | Run project health checks | — |

---

## Package Setup

`docs/package.json` will be a standalone package (not merged with the CLI's `package.json`):

```json
{
  "name": "@gwenjs/cli-docs",
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "^1.x"
  }
}
```

VitePress is isolated in `docs/` to avoid polluting the CLI's own dependencies.

---

## Out of Scope

- API / programmatic usage documentation
- Contributor / engine internals documentation
- Tutorials or guides beyond command reference
- Automated generation from JSDoc/TSDoc (manual authoring only)
