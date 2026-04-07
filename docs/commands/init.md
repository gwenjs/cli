# gwen init

Scaffold a new GWEN game project in a new directory. Creates a complete project structure with TypeScript, Vite, ECS components, systems, and a playable demo scene.

## Usage

```bash
gwen init [name] [options]
```

## Arguments

| Argument | Description                                  |
| -------- | -------------------------------------------- |
| `name`   | Project directory name (prompted if omitted) |

## Options

| Option      | Type   | Description                                         |
| ----------- | ------ | --------------------------------------------------- |
| `--modules` | string | Comma-separated list of optional modules to install |

## Global Options

| Option      | Alias | Type    | Description            |
| ----------- | ----- | ------- | ---------------------- |
| `--verbose` | `-v`  | boolean | Show detailed logs     |
| `--debug`   |       | boolean | Show debug information |

## Generated Files

Running `gwen init my-game` creates:

```
my-game/
├── package.json
├── tsconfig.json
├── oxlint.json
├── .oxfmtrc.json
├── gwen.config.ts
├── README.md
└── src/
    ├── components/
    │   └── game.ts
    ├── systems/
    │   ├── movement.ts
    │   ├── input.ts
    │   ├── collision.ts
    │   ├── spawn.ts
    │   └── render.ts
    └── scenes/
        └── game.ts
```

## Examples

```bash
# Interactive: prompts for project name
gwen init

# Scaffold into "my-game/" directory
gwen init my-game

# Scaffold with additional modules
gwen init my-game --modules @gwenjs/physics2d,@gwenjs/audio
```

## Available Optional Modules

| Module              | Description                        |
| ------------------- | ---------------------------------- |
| `@gwenjs/physics2d` | Rapier-based 2D physics            |
| `@gwenjs/physics3d` | Rapier-based 3D physics            |
| `@gwenjs/audio`     | Web Audio API integration          |
| `@gwenjs/r3f`       | React Three Fiber renderer adapter |
| `@gwenjs/debug`     | Performance HUD and inspector      |

::: info
`@gwenjs/renderer-canvas2d` and `@gwenjs/input` are always included in new projects.
:::
