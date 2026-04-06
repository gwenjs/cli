# gwen build

Compiler le projet pour la production. Compile TypeScript, bundle les assets et inclut le support WASM.

## Utilisation

```bash
gwen build [options]
```

## Options

| Option | Alias | Type | Défaut | Description |
|--------|-------|------|--------|-------------|
| `--mode` | | string | `release` | Mode de build : `release` ou `debug` |
| `--out-dir` | `-o` | string | `dist` | Répertoire de sortie |
| `--dry-run` | | boolean | `false` | Simuler le build sans écrire de fichiers |

## Options globales

| Option | Alias | Type | Description |
|--------|-------|------|-------------|
| `--verbose` | `-v` | boolean | Afficher les logs détaillés |
| `--debug` | | boolean | Afficher les informations de débogage |

## Exemples

```bash
# Build de production (défaut)
gwen build

# Build de débogage
gwen build --mode debug

# Répertoire de sortie personnalisé
gwen build --out-dir public

# Simulation sans écriture de fichiers (utile en CI)
gwen build --dry-run --verbose
```

## Notes

- Les erreurs de build sont affichées sur stderr et le processus se termine avec le code 3.
- `--dry-run` est utile pour la validation en CI sans effets de bord.
