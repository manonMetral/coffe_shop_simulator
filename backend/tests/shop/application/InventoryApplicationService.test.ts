import { describe, expect, it } from 'vitest';
import { InventoryApplicationService } from '../../../src/shop/application/InventoryApplicationService.js';
import { UnknownDrinkError } from '../../../src/shop/domain/errors.js';
import { Inventory } from '../../../src/shop/domain/inventory/Inventory.js';
import { DrinkName } from '../../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../../src/shop/domain/menu/IngredientName.js';
import { InMemoryInventoryRepository } from '../../../src/shop/infrastructure/secondary/InMemoryInventoryRepository.js';
import { InMemoryMenuRepository } from '../../../src/shop/infrastructure/secondary/InMemoryMenuRepository.js';
import { createTestMenu } from '../testMenu.js';

const { COFFEE, MILK } = IngredientName;

function createService(capacity = 1000, threshold = 100) {
  const inventoryRepository = new InMemoryInventoryRepository(
    Inventory.full([COFFEE, MILK], capacity, threshold),
  );
  const service = new InventoryApplicationService(
    inventoryRepository,
    new InMemoryMenuRepository(createTestMenu()),
  );
  return { service, inventoryRepository };
}

describe('InventoryApplicationService', () => {
  it('lists the stock of every ingredient', async () => {
    const { service } = createService();

    expect(await service.getInventory()).toEqual([
      { ingredient: COFFEE, quantity: 1000, capacity: 1000, low: false },
      { ingredient: MILK, quantity: 1000, capacity: 1000, low: false },
    ]);
  });

  it('consumes the ingredients of a drink and persists the new stock', async () => {
    const { service, inventoryRepository } = createService();

    await service.consumeIngredientsFor(DrinkName.LATTE);

    expect((await inventoryRepository.get()).quantityOf(COFFEE)).toBe(998);
    expect((await service.getInventory())[1]).toMatchObject({ ingredient: MILK, quantity: 999 });
  });

  it('returns the low stock alerts triggered by a drink', async () => {
    const { service } = createService(102, 100);

    expect(await service.consumeIngredientsFor(DrinkName.ESPRESSO)).toEqual([
      { ingredient: COFFEE, remaining: 100 },
    ]);
    expect((await service.getInventory())[0]?.low).toBe(true);
  });

  it('rejects a drink that is not on the menu', async () => {
    const { service } = createService();

    await expect(service.consumeIngredientsFor(DrinkName.TEA)).rejects.toThrow(UnknownDrinkError);
  });
});
