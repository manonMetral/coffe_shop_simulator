# Coffee Shop Simulator

Application full-stack Node.js + Vue.js (monorepo workspaces npm). Voir `README.md` pour la description du projet.

- `backend/` : Express 5, TypeScript, Vitest + Supertest
- `frontend/` : Vue 3, Vite, TypeScript, Pinia, Vue Router, Vitest

## Commandes

Node 22.12+ requis (`nvm use`, voir `.nvmrc`).

- `npm run dev` : backend (3000) et frontend (5173) en parallèle
- `npm test` : tests des deux workspaces
- `npm run test:coverage` : tests avec couverture (seuil de 100 %, utilisé par la CI)
- `npm run typecheck` : vérification TypeScript
- `npm run build` : build des deux workspaces

## Conventions Git et CI

### Branches

- Jamais de push direct sur `main`. Tout changement passe par une branche dédiée, fusionnée via pull request.
- Nommage : `feat/<description-de-la-feature>` pour une fonctionnalité, `fix/<description-du-correctif>` pour un correctif (kebab-case, ex. `feat/customer-queue`, `fix/stock-negative-value`).

### Tests et couverture

- La CI exécute les tests sur chaque branche.
- Couverture de 100 % exigée sur le code de l'application (backend et frontend). Une couverture inférieure fait échouer la CI.
- Tout code ajouté ou modifié est livré avec ses tests.

### Versionnement

- À chaque merge sur `main`, la CI incrémente automatiquement la version mineure (ex. `v0.1.0` -> `v0.2.0`) en créant le tag et la GitHub Release correspondants.
- La version de référence est le dernier tag `vX.Y.0`. Les `package.json` ne sont pas modifiés par la CI (aucun commit automatique sur `main`).

## Mise en œuvre

- `.github/workflows/ci.yml` : typecheck, tests avec couverture et build sur chaque push de branche (hors `main`). Réutilisé par `release.yml`.
- `.github/workflows/release.yml` : sur `main`, rejoue la CI, calcule la prochaine version mineure à partir du dernier tag, puis crée le tag et la GitHub Release (notes générées automatiquement). Utilise le `GITHUB_TOKEN`, sans secret ni contournement de la protection de `main`.
- Seuils de couverture à 100 % dans `backend/vitest.config.ts` et `frontend/vite.config.ts`.
