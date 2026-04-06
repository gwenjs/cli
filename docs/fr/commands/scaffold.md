# gwen scaffold

Générer des artefacts pour un projet GWEN : plugins de runtime, modules de build, ou packages de plugin communautaires complets.

## Sous-commandes

| Sous-commande | Description |
|---------------|-------------|
| [`gwen scaffold plugin`](#gwen-scaffold-plugin) | Générer un stub de plugin de runtime |
| [`gwen scaffold module`](#gwen-scaffold-module) | Générer un stub de module de build |
| [`gwen scaffold package`](#gwen-scaffold-package) | Générer un package de plugin communautaire complet |

---

## gwen scaffold plugin

Génère un stub de plugin de runtime dans `src/plugins/<nom>/index.ts`.

### Utilisation

```bash
gwen scaffold plugin [nom]
```

### Arguments

| Argument | Requis | Description |
|----------|--------|-------------|
| `nom` | Non | Nom du plugin en kebab-case (demandé si absent) |

### Exemple

```bash
gwen scaffold plugin my-renderer
# → src/plugins/my-renderer/index.ts
```

---

## gwen scaffold module

Génère un stub de module de build dans `src/modules/<nom>/index.ts`.

### Utilisation

```bash
gwen scaffold module [nom]
```

### Arguments

| Argument | Requis | Description |
|----------|--------|-------------|
| `nom` | Non | Nom du module en kebab-case (demandé si absent) |

### Exemple

```bash
gwen scaffold module my-module
# → src/modules/my-module/index.ts
```

---

## gwen scaffold package

Génère un package de plugin communautaire complet dans un nouveau répertoire `<nom>/`. Inclut la config TypeScript, la config Vite, le plugin, le composable, l'augmentation de types et le module de build.

### Utilisation

```bash
gwen scaffold package [nom] [options]
```

### Arguments

| Argument | Requis | Description |
|----------|--------|-------------|
| `nom` | Non | Nom du package en kebab-case (demandé si absent) |

### Options

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `--gwen-version` | string | `^0.1.0` | Plage de version peer dependency GWEN |

### Structure générée

```
<nom>/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.ts
    ├── types.ts
    ├── plugin.ts
    ├── composables.ts
    ├── augment.ts
    └── module.ts
```

### Exemples

```bash
gwen scaffold package my-plugin
# → my-plugin/

gwen scaffold package my-plugin --gwen-version "^0.2.0"
```
