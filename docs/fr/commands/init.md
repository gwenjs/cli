# gwen init

Créer un nouveau projet de jeu GWEN dans un nouveau répertoire. Génère une structure de projet complète avec TypeScript, Vite, des composants ECS, des systèmes et une scène de démonstration jouable.

## Utilisation

```bash
gwen init [nom] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `nom` | Nom du répertoire du projet (demandé si absent) |

## Options

| Option | Type | Description |
|--------|------|-------------|
| `--modules` | string | Liste de modules optionnels séparés par des virgules |

## Options globales

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Afficher les logs détaillés |
| `--debug` | | boolean | Afficher les informations de débogage |

## Fichiers générés

La commande `gwen init my-game` crée :

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

## Exemples

```bash
# Interactif : demande le nom du projet
gwen init

# Créer le projet dans "my-game/"
gwen init my-game

# Avec des modules additionnels
gwen init my-game --modules @gwenjs/physics2d,@gwenjs/audio
```

## Modules optionnels disponibles

| Module | Description |
|--------|-------------|
| `@gwenjs/physics2d` | Physique 2D basée sur Rapier |
| `@gwenjs/physics3d` | Physique 3D basée sur Rapier |
| `@gwenjs/audio` | Intégration Web Audio API |
| `@gwenjs/r3f` | Adaptateur de rendu React Three Fiber |
| `@gwenjs/debug` | HUD de performance et inspecteur |

::: info
`@gwenjs/renderer-canvas2d` et `@gwenjs/input` sont toujours inclus dans les nouveaux projets.
:::
