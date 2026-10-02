import type { Inventory } from '../../domain/inventory/Inventory.js';
import type { InventoryRepository } from '../../domain/inventory/InventoryRepository.js';

export class InMemoryInventoryRepository implements InventoryRepository {
  constructor(private inventory: Inventory) {}

  async get(): Promise<Inventory> {
    return this.inventory;
  }

  async save(inventory: Inventory): Promise<void> {
    this.inventory = inventory;
  }
}
