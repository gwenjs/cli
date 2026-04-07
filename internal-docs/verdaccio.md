# Utilisation de Verdaccio — registry local GWEN

> Workflow de développement local pour tester `@gwenjs/cli` contre des packages `@gwenjs/*` non encore publiés sur npm.

---

## Contexte

Le projet **gwen** héberge un registry [Verdaccio](https://verdaccio.org/) local (`http://localhost:4873`).

Il sert à publier tous les packages `@gwenjs/*` en local afin que les projets dépendants (`@gwenjs/cli`, projets de jeu générés par `gwen init`, etc.) puissent les installer **sans passer par npm public**.

---

## Architecture

```
gwen/
├── verdaccio.yaml              # Config Verdaccio (storage, auth, uplinks)
├── .verdaccio/htpasswd         # Fichier d'auth (généré automatiquement)
├── scripts/
│   └── verdaccio-publish.sh   # Script de publication de tous les @gwenjs/*
└── .npmrc                      # @gwenjs:registry=http://localhost:4873

cli/
└── .npmrc  (gitignored)        # Idem — redirige @gwenjs/* vers localhost:4873
```

**Storage :** `~/.local/share/verdaccio/storage`  
**Port :** `4873` (défaut Verdaccio)  
**Auth :** publication anonyme pour `@gwenjs/*` (pas de token requis)

---

## Démarrage du registry

Depuis le projet **gwen** :

```bash
pnpm verdaccio:start
```

Verdaccio tourne alors sur `http://localhost:4873`.  
L'interface web est accessible à la même URL.

> Laisser le terminal ouvert ou lancer en arrière-plan :
> ```bash
> pnpm verdaccio:start &
> ```

---

## Publication des packages `@gwenjs/*`

Depuis le projet **gwen** :

```bash
pnpm verdaccio:publish
```

Ce script (`scripts/verdaccio-publish.sh`) :
1. Vérifie que Verdaccio tourne (sinon, exit avec message d'erreur)
2. **Vide** le storage `~/.local/share/verdaccio/storage/@gwenjs` (évite les conflits de version)
3. Build tous les packages `@gwenjs/*` via `pnpm --filter '@gwenjs/*' build`
4. Publie avec `pnpm -r publish --registry http://localhost:4873 --no-git-checks --force`

---

## Configuration `.npmrc` dans `@gwenjs/cli`

Le fichier `.npmrc` à la racine du projet `cli` est **gitignored** (intentionnel — contient un token local).

Son contenu :

```ini
@gwenjs:registry=http://localhost:4873
//localhost:4873/:_authToken=local-dev
```

Cela redirige uniquement les packages `@gwenjs/*` vers Verdaccio.  
Tous les autres packages continuent de passer par `registry.npmjs.org`.

> **Recréer le `.npmrc` si absent :**
> ```bash
> echo "@gwenjs:registry=http://localhost:4873" >> .npmrc
> echo "//localhost:4873/:_authToken=local-dev" >> .npmrc
> ```

---

## Workflow complet

```bash
# 1. Depuis le projet gwen — démarrer Verdaccio
cd <gwen>
pnpm verdaccio:start &

# 2. Publier tous les packages @gwenjs/* sur le registry local
pnpm verdaccio:publish

# 3. Depuis le projet cli — installer les dépendances
cd <cli>
pnpm install          # @gwenjs/* résolu depuis localhost:4873

# 4. Tester le CLI localement
pnpm build
node bin.js --help
```

---

## Vérifier ce qui est publié

```bash
# Lister les packages @gwenjs publiés
curl http://localhost:4873/-/all 2>/dev/null | jq 'keys | map(select(startswith("@gwenjs")))'

# Ou consulter l'interface web
open http://localhost:4873
```

---

## Notes

- **CI (GitHub Actions)** : Verdaccio n'est **jamais** utilisé en CI. Les packages `@gwenjs/*` doivent être publiés sur npm avant que la CI puisse les résoudre.
- **Storage persistant** : le storage survive aux redémarrages de Verdaccio. `pnpm verdaccio:publish` le nettoie à chaque publication pour éviter les artefacts.
- **Pas de version bump nécessaire** : le flag `--force` permet de republier la même version.
