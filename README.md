# coffe_shop_simulator

## Description

Coffee Shop Simulator is a game‑inspired full‑stack application designed to explore Node.js and Vue.js through an engaging and interactive experience.

On the frontend, customers appear randomly, each with their own personality, patience level, and preferred drink. Players assign servers to prepare and deliver orders, manage queues, and keep customers happy.

On the backend, the system handles inventory levels, recipe validation, stock depletion, preparation timing, and special events such as rush hours or low‑stock alerts. Real‑time updates are powered by WebSockets, ensuring the game reacts instantly to backend events.

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
cp backend/.env.example backend/.env   # optionnel, valeurs par défaut identiques
npm run dev
```

- Frontend : http://localhost:5173 (le proxy Vite redirige `/api` vers le backend)
- Backend : http://localhost:3000/api/health

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
backend/src/    app.ts (composition root), server.ts, config.ts
                health/ domain, application, infrastructure/{primary,secondary}
backend/tests/  health/ (même découpage que src), tests d'API (Supertest) et d'architecture
frontend/src/   main.ts (composition root), App.vue, router/
                health/ domain, application, infrastructure/{primary,secondary}
```
