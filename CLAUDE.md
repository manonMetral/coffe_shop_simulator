# Coffee Shop Simulator

Application full-stack Node.js + Vue.js (monorepo workspaces npm). Voir `README.md` pour la description du projet.

- `backend/` : Express 5, TypeScript, Vitest + Supertest
- `frontend/` : Vue 3, Vite, TypeScript, Pinia, Vue Router, Vitest

## Domaine

Simulation autonome : le joueur n'intervient pas. Le backend est autoritaire (clients, assignation, préparation, stock, argent, journées) et le frontend affiche l'état en temps réel via WebSocket (`ws`). Le détail est construit étape par étape ; les règles ci-dessous sont la cible.

- Horloge accélérée et configurable (une journée de 8 h simulées dure 1 h réelle par défaut). L'horloge, le planificateur de ticks et le générateur aléatoire (avec graine) sont des ports, remplacés par des doubles dans les tests : jamais d'attente réelle ni de hasard non maîtrisé.
- Persistance en mémoire derrière des ports, une seule boutique. Les paramètres (serveurs, caisse, prix, seuils) viennent de la configuration du backend.
- Prix de vente d'une boisson = coût de revient de sa recette x 1,30 (marge de 30 %).
- Réassort automatique : alerte sous 100 unités d'un ingrédient ; budget par ingrédient = caisse / nombre d'ingrédients du catalogue ; quantité entre 100 et 1000 unités, dans la limite du budget et de la place restante.
- Les événements du domaine sont publiés par un port, un adaptateur secondaire les diffuse en WebSocket (message `snapshot` à la connexion, puis messages `event`).

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

- À chaque merge sur `main`, la CI incrémente automatiquement la version mineure (ex. `0.1.0` -> `0.2.0`) et crée le tag correspondant.
- Ne pas modifier la version à la main dans les `package.json`.

## Mise en œuvre

- `.github/workflows/ci.yml` : typecheck, tests avec couverture et build sur chaque push de branche (hors `main`). Réutilisé par `release.yml`.
- `.github/workflows/release.yml` : sur `main`, rejoue la CI puis incrémente la version mineure (root et workspaces), commit `chore(release): vX.Y.Z [skip ci]` et tag `vX.Y.Z`.
- Seuils de couverture à 100 % dans `backend/vitest.config.ts` et `frontend/vite.config.ts`.

Reste à faire côté GitHub (hors repo) : protéger `main` (PR obligatoire, check `test` requis) en autorisant `github-actions[bot]` à contourner la protection pour le commit de version.
