# coffe_shop_simulator

## Description

Coffee Shop Simulator is a game‑inspired full‑stack application designed to explore Node.js and Vue.js through an engaging and interactive experience.

Customers appear randomly, each with their own personality, patience level, and preferred drink. Servers, each with their own speed and skills, are assigned automatically to prepare and deliver orders from the queue. There is no player interaction: the frontend is a live, animated view of the coffee shop, with days, a cash register and a daily report.

On the backend, the system handles inventory levels, recipe validation, stock depletion, preparation timing, and special events such as rush hours or low‑stock alerts. The backend drives the whole simulation, and real‑time updates are pushed to the frontend through WebSockets, so the display reacts instantly to backend events.

The project blends game mechanics with real operational logic, making it an ideal playground for practicing REST API design, WebSocket communication, state management with Pinia, and backend business rules such as stock verification, order workflows, and event broadcasting.

## Stack

- **Backend** (`backend/`) : Node.js, Express 5, TypeScript, Vitest + Supertest
- **Frontend** (`frontend/`) : Vue 3, Vite, TypeScript, Pinia, Vue Router, Vitest

Monorepo géré avec les workspaces npm.

## Prérequis

Node.js 22.12+ (voir `.nvmrc`, Node 24 recommandé) :

```bash
nvm use
```

## Démarrage

```bash
npm install
npm run dev
```

Le backend lit sa configuration dans les variables d'environnement (liste et valeurs par défaut dans `backend/.env.example`, le fichier n'est pas chargé automatiquement). Les valeurs sont validées au démarrage : une variable invalide (non numérique, vide, hors bornes) arrête le backend avec la liste des erreurs. Exemple : `TIME_SCALE=60 npm run dev` accélère la simulation.

- Frontend : http://localhost:5173 (le proxy Vite redirige `/api` vers le backend)
- Backend : http://localhost:3000, avec `GET /api/health`, `GET /api/menu` (boissons, recettes, coût et prix de vente en centimes), `GET /api/inventory` (stock par ingrédient), `GET /api/staff` (serveurs, vitesse, boissons maîtrisées, commande en cours) et un WebSocket sur `/ws` (snapshot à la connexion, puis événements de la simulation)

## Scripts

| Commande                | Effet                                    |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Lance backend et frontend en parallèle   |
| `npm test`              | Tests backend et frontend                |
| `npm run test:coverage` | Tests avec couverture (100 % exigé)      |
| `npm run typecheck`     | Vérification TypeScript des deux parties |
| `npm run build`         | Build des deux parties                   |
| `npm run format`        | Formatage Prettier                       |

## Structure

Architecture hexagonale par contexte métier, vérifiée par `arch-unit-ts` (voir `CLAUDE.md`).

```
backend/src/    composition/, app.ts, bootstrap.ts (composition root), server.ts, config.ts
                health/, shop/, simulation/ : domain, application, infrastructure/{primary,secondary}
backend/tests/  health/ (même découpage que src), tests d'API (Supertest) et d'architecture
frontend/src/   main.ts (composition root), App.vue, router/, views/
                health/, shop/ : domain, application, infrastructure/{primary,secondary}
```
