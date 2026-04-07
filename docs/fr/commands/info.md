# gwen info

Afficher le `gwen.config.ts` parsé sous forme de JSON sur stdout. Utile pour déboguer les problèmes de configuration ou pour utiliser avec `jq`.

## Utilisation

```bash
gwen info [options]
```

## Options globales

| Option      | Alias | Type    | Description                           |
| ----------- | ----- | ------- | ------------------------------------- |
| `--verbose` | `-v`  | boolean | Afficher les logs détaillés           |
| `--debug`   |       | boolean | Afficher les informations de débogage |

## Exemples

```bash
# Afficher la configuration complète
gwen info

# Inspecter un champ spécifique avec jq
gwen info | jq '.engine'
gwen info | jq '.modules'
```

## Notes

- Se termine avec le code 4 si `gwen.config.ts` est introuvable ou ne peut pas être parsé.
- La sortie est du JSON valide sur stdout ; les logs de diagnostic vont sur stderr.
