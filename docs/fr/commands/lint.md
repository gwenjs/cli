# gwen lint

Analyser le code source avec [oxlint](https://oxc.rs/docs/guide/usage/linter).

## Utilisation

```bash
gwen lint [options]
```

## Options

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `--fix` | boolean | `false` | Corriger automatiquement les erreurs de lint |
| `--path` | string | `src` | Chemin à analyser |

## Options globales

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Afficher les logs détaillés |
| `--debug` | | boolean | Afficher les informations de débogage |

## Exemples

```bash
# Analyser src/
gwen lint

# Analyser et corriger automatiquement
gwen lint --fix

# Analyser un répertoire spécifique
gwen lint --path src/systems
```
