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

## Architecture hexagonale

Backend et frontend suivent la même organisation, par contexte métier (aujourd'hui : `health`) :

```
src/<contexte>/
  package-info.ts              étend BusinessContext (déclare le contexte)
  domain/                      modèle et ports (interfaces), sans dépendance extérieure
  application/                 services applicatifs, dépendent du domaine uniquement
  infrastructure/primary/      adaptateurs entrants (routes Express, composants Vue, stores Pinia)
  infrastructure/secondary/    adaptateurs sortants (implémentent les ports du domaine)
```

- Règles : le domaine ne dépend que du domaine ; l'application ne dépend pas de l'infrastructure ; le primaire ne dépend pas du secondaire ; le secondaire ne dépend pas de l'application ; un contexte ne dépend pas du domaine d'un autre.
- Les dépendances sont assemblées hors des contextes (composition root) : `backend/src/app.ts` et `frontend/src/main.ts`. Côté frontend, le service applicatif est fourni aux composants par `provide`/`inject` (`healthServiceKey`).
- Les règles sont vérifiées avec `arch-unit-ts` : `backend/tests/HexagonalArchTest.test.ts` et `frontend/src/HexagonalArchTest.test.ts`. Un nouveau contexte est détecté dès qu'il contient un `package-info.ts` qui étend `BusinessContext`.
- Limite : `arch-unit-ts` n'analyse que les fichiers `.ts`, pas le contenu des `.vue`. Garder les composants Vue minces et placer la logique dans des `.ts` (stores, services).
- Les tests du backend reprennent le même découpage : `backend/tests/<contexte>/{application,infrastructure/primary,infrastructure/secondary}/`. Pas de dossier `domain` tant que le domaine ne contient que des types. Les tests de la composition root (`app`, `config`, `server`) et d'architecture restent à la racine de `backend/tests/`.
- `BusinessContext.ts` et les `package-info.ts` sont exclus de la couverture (classes marqueurs sans logique).

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
