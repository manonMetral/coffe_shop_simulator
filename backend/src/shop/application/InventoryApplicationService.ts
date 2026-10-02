import type { InventoryRepository } from '../domain/inventory/InventoryRepository.js';
import type { StockLow } from '../domain/inventory/StockLow.js';
import type { DrinkName } from '../domain/menu/DrinkName.js';
import type { IngredientName } from '../domain/menu/IngredientName.js';
import type { MenuRepository } from '../domain/menu/MenuRepository.js';

export interface StockView {
  ingredient: IngredientName;
  quantity: number;
  capacity: number;
  low: boolean;
}

export class InventoryApplicationService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly menuRepository: MenuRepository,
  ) {}

  async getInventory(): Promise<StockView[]> {
    const inventory = await this.inventoryRepository.get();
    return inventory.levels().map(({ ingredient, quantity }) => ({
      ingredient,
      quantity,
      capacity: inventory.capacity,
      low: inventory.isLow(ingredient),
    }));
  }

  /** Consumes the ingredients needed for a drink and returns the low stock alerts it triggers. */
  async consumeIngredientsFor(drink: DrinkName): Promise<StockLow[]> {
    const [inventory, menu] = await Promise.all([
      this.inventoryRepository.get(),
      this.menuRepository.get(),
    ]);
    const alerts = inventory.consume(menu.drink(drink).recipe);
    await this.inventoryRepository.save(inventory);
    return alerts;
  }
}
