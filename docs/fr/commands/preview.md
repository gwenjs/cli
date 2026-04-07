# gwen preview

Prévisualiser le build de production en local. Exécuter `gwen build` au préalable.

## Utilisation

```bash
gwen preview [options]
```

## Options

| Option   | Alias | Type   | Défaut | Description                                      |
| -------- | ----- | ------ | ------ | ------------------------------------------------ |
| `--port` | `-p`  | string | `4173` | Port du serveur de prévisualisation (1024–65535) |

## Options globales

| Option      | Alias | Type    | Description                           |
| ----------- | ----- | ------- | ------------------------------------- |
| `--verbose` | `-v`  | boolean | Afficher les logs détaillés           |
| `--debug`   |       | boolean | Afficher les informations de débogage |

## Exemples

```bash
# Prévisualiser sur le port par défaut 4173
gwen preview

# Prévisualiser sur un port personnalisé
gwen preview --port 8080
gwen preview -p 8080
```

## Notes

- Le port doit être un entier entre 1024 et 65535. Un port invalide provoque une sortie avec le code 2.
- Exécuter `gwen build` avant `gwen preview` pour générer le dossier `dist/`.
