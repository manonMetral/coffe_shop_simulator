import { describe, expect, it } from 'vitest';
import { MenuApplicationService } from '../../../src/shop/application/MenuApplicationService.js';
import { DrinkName } from '../../../src/shop/domain/menu/DrinkName.js';
import { IngredientName } from '../../../src/shop/domain/menu/IngredientName.js';
import { InMemoryMenuRepository } from '../../../src/shop/infrastructure/secondary/InMemoryMenuRepository.js';
import { createTestMenu } from '../testMenu.js';

describe('MenuApplicationService', () => {
  it('lists the drinks with their cost, price and recipe', async () => {
    const service = new MenuApplicationService(new InMemoryMenuRepository(createTestMenu()));

    const menu = await service.getMenu();

    expect(menu).toHaveLength(2);
    expect(menu[1]).toEqual({
      name: DrinkName.LATTE,
      costCents: 550,
      priceCents: 715,
      recipe: [
        { ingredient: IngredientName.COFFEE, quantity: 2 },
        { ingredient: IngredientName.MILK, quantity: 1 },
      ],
    });
  });
});
