# gwen prepare

Générer le répertoire `.gwen/` contenant la configuration TypeScript et les définitions de types pour le projet. À exécuter après chaque modification de `gwen.config.ts`.

## Utilisation

```bash
gwen prepare [options]
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `--strict` | boolean | **Déprécié.** Le comportement strict est désormais activé par défaut. |

## Options globales

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Afficher les logs détaillés |
| `--debug` | | boolean | Afficher les informations de débogage |

## Fichiers générés

```
.gwen/
├── tsconfig.json
└── types/
    └── (définitions de types générées)
```

## Exemples

```bash
# Générer les fichiers .gwen/
gwen prepare

# Avec sortie détaillée
gwen prepare --verbose
```

## Notes

- Les erreurs de génération sont affichées et le processus se termine avec le code 4.
- Exécuter `gwen prepare` après chaque modification de `gwen.config.ts`.

::: warning Option dépréciée
`--strict` est déprécié. Le comportement strict est activé par défaut depuis la version 0.1.0. L'option est acceptée mais ignorée.
:::
