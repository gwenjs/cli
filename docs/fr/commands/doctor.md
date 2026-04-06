# gwen doctor

Exécuter une série de vérifications de santé du projet et afficher les résultats. Utile pour diagnostiquer les problèmes d'environnement ou de configuration.

## Utilisation

```bash
gwen doctor
```

## Vérifications effectuées

| Vérification | Ce qui est contrôlé |
|--------------|---------------------|
| Version Node.js | Node.js ≥ 18 est installé |
| `gwen.config.ts` existe | Le fichier de configuration est présent dans le répertoire courant |
| `gwen.config.ts` se parse | La configuration peut être chargée sans erreur |
| Binaire WASM | Le binaire WASM `@gwenjs/core` est présent dans `node_modules` |

## Exemple de sortie

```
✓ Node.js version: v22.0.0
✓ gwen.config.ts exists: /my-game/gwen.config.ts
✓ gwen.config.ts parses: /my-game/gwen.config.ts
✓ WASM binary: /my-game/node_modules/@gwenjs/core/dist/gwen.wasm

All checks passed ✓
```

## Notes

- Se termine avec le code 1 si une vérification échoue.
- Si `gwen.config.ts` est introuvable, exécuter `gwen init` pour créer un nouveau projet.
- Si le binaire WASM est absent, exécuter l'installation du gestionnaire de paquets (`npm install` / `pnpm install`).
