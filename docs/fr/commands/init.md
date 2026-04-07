# gwen init

Créer un nouveau projet de jeu GWEN dans un nouveau répertoire. Génère une structure de projet complète avec TypeScript, Vite, des composants ECS, des systèmes et une scène de démonstration jouable.

## Utilisation

```bash
gwen init [nom] [options]
```

## Arguments

| Argument | Description                                     |
| -------- | ----------------------------------------------- |
| `nom`    | Nom du répertoire du projet (demandé si absent) |

## Options

| Option      | Type   | Description                                          |
| ----------- | ------ | ---------------------------------------------------- |
| `--modules` | string | Liste de modules optionnels séparés par des virgules |

## Options globales

| Option      | Alias | Type    | Description                           |
| ----------- | ----- | ------- | ------------------------------------- |
| `--verbose` | `-v`  | boolean | Afficher les logs détaillés           |
| `--debug`   |       | boolean | Afficher les informations de débogage |

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

## Modules optionnels

Lors de l'exécution de `gwen init`, vous pouvez sélectionner des modules optionnels à inclure dans votre projet. La liste est récupérée en direct depuis le registre de modules GWEN et peut évoluer au fil du temps.

Utilisez `--modules` pour ignorer le prompt interactif et passer une liste séparée par des virgules :

```bash
gwen init my-game --modules @gwenjs/physics2d,@gwenjs/audio
```

::: info
`@gwenjs/input` est toujours inclus dans les nouveaux projets.
:::
