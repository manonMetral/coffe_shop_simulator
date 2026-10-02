import type { SimulationSnapshot } from './SimulationSnapshot.js';

export type SnapshotProvider = () => Promise<SimulationSnapshot>;
