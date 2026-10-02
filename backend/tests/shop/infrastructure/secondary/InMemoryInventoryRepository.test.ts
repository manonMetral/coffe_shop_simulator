import { describe, expect, it } from 'vitest';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Inventory } from '../../../../src/shop/domain/inventory/Inventory.js';
import { InMemoryInventoryRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryInventoryRepository.js';

describe('InMemoryInventoryRepository', () => {
  it('returns the inventory it was created with', async () => {
    const inventory = Inventory.full([IngredientName.COFFEE], 10, 1);

    expect(await new InMemoryInventoryRepository(inventory).get()).toBe(inventory);
  });

  it('replaces the inventory on save', async () => {
    const repository = new InMemoryInventoryRepository(
      Inventory.full([IngredientName.COFFEE], 10, 1),
    );
    const other = Inventory.full([IngredientName.MILK], 20, 2);

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});
