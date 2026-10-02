import type { Inventory } from './Inventory.js';

export interface InventoryRepository {
  get(): Promise<Inventory>;
  save(inventory: Inventory): Promise<void>;
}
