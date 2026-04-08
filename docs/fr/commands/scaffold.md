# gwen scaffold

Génère un package de plugin communautaire pour l'écosystème GWEN.

## Sous-commandes

| Sous-commande                                     | Description                                        |
| ------------------------------------------------- | -------------------------------------------------- |
| [`gwen scaffold package`](#gwen-scaffold-package) | Générer un package de plugin communautaire complet |

---

## gwen scaffold package

Génère un package de plugin communautaire complet dans un nouveau répertoire `<nom>/`. Inclut la config TypeScript, le build Vite, le plugin, le composable, l'augmentation de types et le module de build.

Utilisez `--renderer` (ou sélectionnez **Renderer package** interactivement) pour générer des templates spécifiques aux renderers qui implémentent le contrat `RendererService` de `@gwenjs/renderer-core`.

### Utilisation

```bash
gwen scaffold package [nom] [options]
```

### Arguments

| Argument | Requis | Description                                      |
| -------- | ------ | ------------------------------------------------ |
| `nom`    | Non    | Nom du package en kebab-case (demandé si absent) |

### Options

| Option           | Type    | Défaut   | Description                                                 |
| ---------------- | ------- | -------- | ----------------------------------------------------------- |
| `--renderer`     | boolean | demandé  | Générer un package renderer (Canvas, WebGL, Three.js, etc.) |
| `--gwen-version` | string  | `^0.1.0` | Plage de version peer dependency GWEN                       |
| `--with-ci`      | boolean | demandé  | Inclure les workflows GitHub Actions CI + publish           |
| `--with-docs`    | boolean | demandé  | Inclure la documentation VitePress                          |

### Structure — package standard

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

### Structure — package renderer

Généré avec `--renderer` ou en sélectionnant **Renderer package** interactivement.

```
<nom>/
├── package.json              ← inclut @gwenjs/renderer-core
├── tsconfig.json
├── vite.config.ts
├── tests/
│   └── conformance.test.ts   ← valide le contrat RendererService
└── src/
    ├── index.ts
    ├── types.ts              ← RendererOptions avec layers
    ├── renderer-service.ts   ← stub defineRendererService
    ├── plugin.ts             ← câblage getOrCreateLayerManager
    ├── composables.ts        ← composable useMyRenderer()
    ├── augment.ts            ← augmentation GwenProvides
    └── module.ts             ← entrée defineGwenModule
```

### Exemples

```bash
# Package standard (sélection de type interactive)
gwen scaffold package my-plugin

# Package renderer via flag (sans prompt)
gwen scaffold package my-renderer --renderer

# Avec CI et docs
gwen scaffold package my-plugin --with-ci --with-docs

# Fixer la version GWEN
gwen scaffold package my-plugin --gwen-version "^0.2.0"
```

### Étapes après le scaffold d'un renderer

1. `cd <nom> && pnpm install`
2. Implémenter `mount`, `unmount`, `resize`, `flush` dans `src/renderer-service.ts`
3. Exécuter `pnpm test` — la suite de conformance doit passer avant la publication
4. Enregistrer dans `gwen.config.ts` :

```ts
import { defineConfig } from "@gwenjs/app";

export default defineConfig({
  modules: [
    [
      "@community/gwen-<nom>",
      {
        layers: {
          background: { order: 0 },
          game: { order: 10 },
        },
      },
    ],
  ],
});
```
