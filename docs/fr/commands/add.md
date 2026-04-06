# gwen add

Installer un module GWEN avec le gestionnaire de paquets du projet et l'enregistrer automatiquement dans `gwen.config.ts`.

## Utilisation

```bash
gwen add <module> [options]
```

## Arguments

| Argument | Requis | Description |
|----------|--------|-------------|
| `module` | ✅ | Nom du package du module (ex : `@gwenjs/physics2d`) |

## Options

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `--dev` | boolean | `false` | Installer comme `devDependency` |

## Exemples

```bash
# Installer un module de runtime
gwen add @gwenjs/physics2d

# Installer comme devDependency
gwen add @gwenjs/debug --dev
```

## Notes

- Le gestionnaire de paquets est détecté automatiquement (npm / pnpm / yarn / bun).
- Le module est ajouté au tableau `modules` dans `gwen.config.ts` automatiquement.
- Exécuter `gwen prepare` après l'ajout d'un module pour régénérer les types `.gwen/`.
