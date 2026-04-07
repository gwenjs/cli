# Commandes

Référence complète de toutes les commandes du CLI `gwen`.

## Options globales

Disponibles sur chaque commande :

| Option      | Alias | Type    | Description                                          |
| ----------- | ----- | ------- | ---------------------------------------------------- |
| `--verbose` | `-v`  | boolean | Afficher les logs détaillés                          |
| `--debug`   |       | boolean | Afficher les informations de débogage (très verbeux) |

## Toutes les commandes

| Commande                      | Description                                     |
| ----------------------------- | ----------------------------------------------- |
| [`gwen init`](./init)         | Créer un nouveau projet de jeu GWEN             |
| [`gwen dev`](./dev)           | Démarrer le serveur de développement            |
| [`gwen build`](./build)       | Compiler le projet pour la production           |
| [`gwen prepare`](./prepare)   | Générer le dossier `.gwen/` (tsconfig + types)  |
| [`gwen preview`](./preview)   | Prévisualiser le build de production en local   |
| [`gwen add`](./add)           | Installer et enregistrer un module GWEN         |
| [`gwen scaffold`](./scaffold) | Générer des artefacts (plugin, module, package) |
| [`gwen lint`](./lint)         | Analyser le code source avec oxlint             |
| [`gwen format`](./format)     | Formater le code source avec oxfmt              |
| [`gwen info`](./info)         | Afficher le `gwen.config.ts` parsé en JSON      |
| [`gwen doctor`](./doctor)     | Vérifier la santé du projet                     |
