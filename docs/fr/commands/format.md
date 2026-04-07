# gwen format

Formater le code source avec [oxfmt](https://oxc.rs).

## Utilisation

```bash
gwen format [options]
```

## Options

| Option    | Type    | Défaut  | Description                                   |
| --------- | ------- | ------- | --------------------------------------------- |
| `--check` | boolean | `false` | Vérifier le formatage sans écrire de fichiers |
| `--path`  | string  | `src`   | Chemin à formater                             |

## Options globales

| Option      | Alias | Type    | Description                           |
| ----------- | ----- | ------- | ------------------------------------- |
| `--verbose` | `-v`  | boolean | Afficher les logs détaillés           |
| `--debug`   |       | boolean | Afficher les informations de débogage |

## Exemples

```bash
# Formater src/
gwen format

# Vérification uniquement — aucun fichier modifié (utile en CI)
gwen format --check

# Formater un répertoire spécifique
gwen format --path src/systems
```

## Notes

- `--check` se termine avec un code non-zéro si un fichier serait modifié. À utiliser en CI pour imposer le formatage.
