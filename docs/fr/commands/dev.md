# gwen dev

Démarrer un serveur de développement avec rechargement à chaud (HMR). Affiche la bannière ASCII GWEN au démarrage.

## Utilisation

```bash
gwen dev [options]
```

## Options

| Option | Alias | Type | Défaut | Description |
|--------|-------|------|--------|-------------|
| `--port` | `-p` | string | `3000` | Port HTTP du serveur (1024–65535) |
| `--open` | `-o` | boolean | `false` | Ouvrir le navigateur automatiquement |

## Options globales

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Afficher les logs détaillés |
| `--debug` | | boolean | Afficher les informations de débogage |

## Exemples

```bash
# Démarrer sur le port par défaut 3000
gwen dev

# Démarrer sur un port personnalisé
gwen dev --port 3001
gwen dev -p 3001

# Ouvrir le navigateur automatiquement
gwen dev --open
gwen dev -o

# Port personnalisé et ouverture automatique
gwen dev -p 8080 -o
```

## Notes

- Le port doit être un entier entre 1024 et 65535. Un port invalide provoque une sortie avec le code 2.
- La bannière ASCII GWEN s'affiche avant tout log.
