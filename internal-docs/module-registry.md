# Registre de modules — Architecture interne

> **Audience :** Contributeurs CLI. Explique le fonctionnement du registre de modules, comment mettre à jour le fallback embarqué, et comment les modules sont soumis au registre distant.

---

## Vue d'ensemble

La liste des modules GWEN optionnels est récupérée à l'exécution depuis le dépôt GitHub `gwenjs/modules`, au lieu d'être codée en dur dans le CLI. Cela découple l'écosystème de modules du cycle de release du CLI — un nouveau module peut être ajouté au registre sans nécessiter une nouvelle version du CLI.

---

## Chaîne de résolution

Quand `gwen init` ou `gwen add` appelle `getModules()` :

```
1. Lecture de ~/.cache/gwen/modules.json
   ├── Frais (âge < TTL)  → retourner les modules en cache
   │     └── Proche de l'expiration (derniers 10% du TTL) → déclencher un refresh en arrière-plan
   └── Expiré ou absent → récupérer le registre distant
         ├── Succès → écriture en cache → retourner les modules
         └── Échec  → consola.warn → retourner le fallback embarqué
```

**URL distante :** `https://raw.githubusercontent.com/gwenjs/modules/main/registry.json`  
**Chemin du cache :** `~/.cache/gwen/modules.json`  
**TTL :** 1 heure (surchargeable via les variables d'environnement `GWEN_REGISTRY_CACHE_PATH` / `GWEN_REGISTRY_TTL_MS` pour les tests)

---

## Fichiers clés

| Fichier                        | Responsabilité                                      |
| ------------------------------ | --------------------------------------------------- |
| `src/utils/module-registry.ts` | `getModules()`, fetch, cache, logique de fallback   |
| `src/data/modules-registry.ts` | Fallback embarqué — mis à jour à chaque release CLI |

---

## Mettre à jour le fallback embarqué

Le fallback embarqué (`src/data/modules-registry.ts`) est utilisé quand le CLI est hors ligne ou que le fetch expire. Il doit rester synchronisé avec le registre distant. **Le mettre à jour avant chaque release CLI :**

1. Copier le contenu de `registry.json` depuis le dépôt `gwenjs/modules`
2. Mettre à jour `src/data/modules-registry.ts` avec la liste des modules à jour
3. Mettre à jour `generatedAt` avec la date actuelle

---

## Soumettre un nouveau module

Les nouveaux modules sont ajoutés via le système d'issues de `gwenjs/modules`, pas via PR directe. L'équipe core GWEN examine les soumissions avant de les fusionner.

Pour soumettre un module :

1. Ouvrir une issue sur `github.com/gwenjs/modules` en utilisant le template **Module Submission**
2. Remplir : nom du package, lien npm, description, catégorie, dépôt GitHub
3. Attendre la validation — l'équipe créera l'entrée dans le registre après examen

---

## Schéma d'un module

Chaque entrée dans `registry.json` suit cette structure :

```typescript
interface GwenModule {
  name: string; // identifiant kebab-case
  displayName: string; // affiché dans les prompts CLI
  description: string;
  npm: string; // nom du package npm
  repo: string; // org/repo sur GitHub
  website?: string; // URL de documentation (optionnel)
  category: string; // ex : "Physics", "Audio"
  type: "official" | "community";
  deprecated: boolean; // masque le module des prompts
  compatibility: { gwen: string }; // plage semver
}
```

Les modules dépréciés (`deprecated: true`) sont silencieusement exclus de tous les prompts CLI. Ils restent dans le registre pour des raisons de référence historique et de compatibilité ascendante.

---

## Variables d'environnement (tests / CI)

| Variable                   | Défaut                       | Utilité                                                                          |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| `GWEN_REGISTRY_CACHE_PATH` | `~/.cache/gwen/modules.json` | Surcharger l'emplacement du cache (utile dans les tests)                         |
| `GWEN_REGISTRY_TTL_MS`     | `3600000` (1 h)              | Surcharger le TTL du cache (mettre à `0` pour forcer un re-fetch dans les tests) |
