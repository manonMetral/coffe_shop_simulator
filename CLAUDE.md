# Coffee Shop Simulator

Application full-stack Node.js + Vue.js (monorepo workspaces npm). Voir `README.md` pour la description du projet.

- `backend/` : Express 5, TypeScript, Vitest + Supertest
- `frontend/` : Vue 3, Vite, TypeScript, Pinia, Vue Router, Vitest

## Domaine

Simulation autonome : le joueur n'intervient pas. Le backend est autoritaire (clients, assignation, préparation, stock, argent, journées) et le frontend affiche l'état en temps réel via WebSocket (`ws`). Le détail est construit étape par étape ; les règles ci-dessous sont la cible.

- Horloge accélérée et configurable (une journée de 8 h simulées dure 1 h réelle par défaut). L'horloge, le planificateur de ticks et le générateur aléatoire (avec graine) sont des ports, remplacés par des doubles dans les tests : jamais d'attente réelle ni de hasard non maîtrisé.
- Persistance en mémoire derrière des ports, une seule boutique. Les paramètres (serveurs, caisse, prix, seuils) viennent de la configuration du backend.
- Prix de vente d'une boisson = coût de revient de sa recette x 1,30 (marge de 30 %).
- Réassort automatique : quand l'alerte de stock bas est déclenchée (100 unités ou moins), le shop commande l'ingrédient si le budget le permet. Budget par ingrédient = caisse / nombre d'ingrédients du catalogue (faibles ou non) ; quantité = min(1000, place restante, budget / prix d'achat unitaire), jamais sous 100 unités. Le paiement est immédiat, la livraison arrive après `RESTOCK_DELAY_MINUTES` (60 min simulées) et un ingrédient déjà commandé n'est pas recommandé. Avec 4 ingrédients et un coût de 2 à 2,50 € l'unité, il faut une caisse d'au moins 800 à 1000 € pour que le premier réassort parte ; sinon il est retenté à chaque tick.
- Rush hour : définie dans le calendrier de `simulation` (par défaut de 12:00 à 14:00, `RUSH_HOUR_*`, durée 0 pour la désactiver). Elle multiplie le rythme d'arrivée des clients (x2,5) et est annoncée par `rush-hour-started` / `rush-hour-ended`. Le multiplicateur est celui du début du tick.
- Bilan de fin de journée : `simulation` ferme la comptabilité de `shop` quand un jour se termine (`day-ended` puis `day-report`). Le bilan contient ventes, pourboires, achats, bénéfice, clients servis et perdus (patience ou rupture), satisfaction moyenne (part de patience restante quand le client est servi, 0 pour un client perdu) et caisse de clôture. Les bilans sont exposés par `GET /api/reports` et dans le snapshot.
- Clients : ils arrivent au hasard (processus de Poisson, 20 par heure simulée par défaut, `CUSTOMERS_PER_HOUR`) avec une personnalité (Pressé 6 min, Exigeant 12, Généreux 15, Décontracté 25 de patience simulée) et une boisson préférée. Le hasard vient d'un `RandomGenerator` avec graine (`RANDOM_SEED`). Un client qui a attendu plus que sa patience quitte la file (`customer-left`).
- Serveurs : 3 au départ (Alice polyvalente, Bob rapide sur le café, Chloé lente), chacun avec une vitesse et des boissons maîtrisées. À chaque tick, les serveurs libres prennent les clients en attente : le client le plus proche de perdre patience d'abord, par le serveur libre le plus rapide qui maîtrise sa boisson. Le stock est consommé au début de la préparation (durée de la boisson / vitesse du serveur) ; si les ingrédients manquent, le client part (`out-of-stock`). À la livraison la caisse reçoit le prix, plus 10 à 20 % de pourboire pour un client généreux (`order-started`, `order-delivered`, `stock-low`, `servers-updated`).
- Les événements sont publiés par un port (`EventPublisher`), un adaptateur secondaire les diffuse en WebSocket sur `/ws` : message `snapshot` à la connexion, puis messages `event` (`clock-tick`, `day-started`, `day-ended`, `customer-arrived`, `customer-left`, `queue-updated`, `order-started`, `order-delivered`, `stock-low`, `restock-ordered`, `restock-delivered`, `inventory-updated`, `servers-updated`, `rush-hour-started`, `rush-hour-ended`, `day-report`). Le frontend reconstruit l'état avec `applyEvent` et se reconnecte seul.
- Scène animée (frontend, `ShopScene.vue`) : la boutique est dessinée en HTML/CSS à partir de l'état du store (file d'attente à l'entrée, un poste par serveur avec le client au comptoir et la progression, caisse, étagère de stock, soleil qui suit l'heure, ciel teinté pendant la rush hour). Les messages flottants (gain à la livraison, client qui part, livraison de stock) sont dérivés des nouvelles entrées du journal (`sceneEffects.ts`). La file n'affiche que 8 clients (`+N autres` pour le reste). Les animations respectent `prefers-reduced-motion`. Le rendu se vérifie avec un vrai navigateur (Chrome headless), les tests jsdom ne voient pas les styles.

## Commandes

Node 22.12+ requis (`nvm use`, voir `.nvmrc`).

- `npm run dev` : backend (3000) et frontend (5173) en parallèle
- `npm test` : tests des deux workspaces
- `npm run test:coverage` : tests avec couverture (seuil de 100 %, utilisé par la CI)
- `npm run typecheck` : vérification TypeScript
- `npm run build` : build des deux workspaces

## Architecture hexagonale

Backend et frontend suivent la même organisation, par contexte métier (backend : `health`, `shop`, `simulation` ; frontend : `shop`) :

```
src/<contexte>/
  package-info.ts              étend BusinessContext (déclare le contexte)
  domain/                      modèle et ports (interfaces), sans dépendance extérieure
  application/                 services applicatifs, dépendent du domaine uniquement
  infrastructure/primary/      adaptateurs entrants (routes Express, composants Vue, stores Pinia)
  infrastructure/secondary/    adaptateurs sortants (implémentent les ports du domaine)
```

- Règles : le domaine ne dépend que du domaine ; l'application ne dépend pas de l'infrastructure ; le primaire ne dépend pas du secondaire ; le secondaire ne dépend pas de l'application ; un contexte ne dépend pas du domaine d'un autre.
- Les dépendances sont assemblées hors des contextes (composition root) : côté backend `backend/src/composition/` (un module par contexte), `app.ts` et `bootstrap.ts` ; côté frontend `frontend/src/main.ts`, avec les pages qui combinent plusieurs contextes dans `frontend/src/views/`. Côté frontend, les services applicatifs sont fournis aux composants par `provide`/`inject` (`shopServiceKey`).
- Backend : un contexte n'appelle jamais l'application ni le domaine d'un autre. Il passe par un port de son domaine, implémenté par un adaptateur secondaire qui appelle un adaptateur primaire dont le nom commence par `TypeScript` dans l'autre contexte (ex. `ShopFlowAdapter` -> `TypeScriptShop`). Seuls les adaptateurs secondaires et la composition root peuvent appeler un adaptateur `TypeScript*`.
- Les règles sont vérifiées avec `arch-unit-ts` : `backend/tests/HexagonalArchTest.test.ts` et `frontend/src/HexagonalArchTest.test.ts`. Un nouveau contexte est détecté dès qu'il contient un `package-info.ts` qui étend `BusinessContext`.
- Les noms du domaine (ingrédients, boissons) sont des enums fixes (`IngredientName`, `DrinkName`) qui servent aussi d'identité : pas d'identifiant en chaîne libre. Ajouter une boisson ou un ingrédient commence par ajouter sa valeur à l'enum.
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
