import { describe, expect, it } from 'vitest';
import { Inventory } from '../../../../src/shop/domain/inventory/Inventory.js';
import type { Ingredient } from '../../../../src/shop/domain/menu/Ingredient.js';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Recipe } from '../../../../src/shop/domain/menu/Recipe.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import {
  MAX_RESTOCK_UNITS,
  MIN_RESTOCK_UNITS,
  planRestocks,
} from '../../../../src/shop/domain/restock/RestockPolicy.js';

const { COFFEE, MILK, TEA, WATER } = IngredientName;

const ingredients: Ingredient[] = [
  { name: COFFEE, unitPrice: Money.ofCents(200) },
  { name: MILK, unitPrice: Money.ofCents(150) },
];

/** An inventory where `used` units of an ingredient are gone. */
function inventoryWith(used: Partial<Record<IngredientName, number>>, names = [COFFEE, MILK]) {
  const inventory = Inventory.full(names, 1000, 100);
  for (const [ingredient, quantity] of Object.entries(used)) {
    inventory.consume(new Recipe([{ ingredient: ingredient as IngredientName, quantity }]));
  }
  return inventory;
}

const plan = (cashCents: number, inventory: Inventory, ordered: IngredientName[] = []) =>
  planRestocks(Money.ofCents(cashCents), ingredients, inventory, new Set(ordered));

describe('planRestocks', () => {
  it('goes from 100 to 1000 units', () => {
    expect([MIN_RESTOCK_UNITS, MAX_RESTOCK_UNITS]).toEqual([100, 1000]);
  });

  it('buys nothing while the stock is not low', () => {
    expect(plan(1_000_000, inventoryWith({ [COFFEE]: 800 }))).toEqual([]);
  });

  it('buys what the budget of the ingredient allows once the stock is low', () => {
    const orders = plan(100000, inventoryWith({ [COFFEE]: 900 }));

    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ ingredient: COFFEE, quantity: 250 });
    expect(orders[0]?.cost.cents).toBe(50000);
  });

  it('shares the cash equally between all the ingredients of the menu, low or not', () => {
    const four: Ingredient[] = [
      ...ingredients,
      { name: TEA, unitPrice: Money.ofCents(250) },
      { name: WATER, unitPrice: Money.ofCents(200) },
    ];
    const inventory = inventoryWith({ [COFFEE]: 900 }, [COFFEE, MILK, TEA, WATER]);

    const [order] = planRestocks(Money.ofCents(100000), four, inventory, new Set());

    // 1000 EUR shared between 4 ingredients: 250 EUR for the coffee, at 2 EUR a unit.
    expect(order).toMatchObject({ ingredient: COFFEE, quantity: 125 });
  });

  it('buys nothing when the budget does not allow the minimum of 100 units', () => {
    expect(plan(30000, inventoryWith({ [COFFEE]: 900 }))).toEqual([]);
  });

  it('buys exactly 100 units when the budget allows exactly that', () => {
    const [order] = plan(40000, inventoryWith({ [COFFEE]: 900 }));

    expect(order).toMatchObject({ quantity: 100 });
    expect(order?.cost.cents).toBe(20000);
  });

  it('never buys more than 1000 units', () => {
    const [order] = plan(100_000_000, inventoryWith({ [COFFEE]: 1000 }));

    expect(order).toMatchObject({ ingredient: COFFEE, quantity: 1000 });
  });

  it('never buys more than the room left in the stock', () => {
    const [order] = plan(100_000_000, inventoryWith({ [COFFEE]: 900 }));

    expect(order).toMatchObject({ quantity: 900 });
  });

  it('does not order again an ingredient that is already on its way', () => {
    expect(plan(100000, inventoryWith({ [COFFEE]: 900 }), [COFFEE])).toEqual([]);
  });

  it('gives each low ingredient its own budget', () => {
    const orders = plan(200000, inventoryWith({ [COFFEE]: 900, [MILK]: 950 }));

    expect(orders.map(({ ingredient, quantity }) => [ingredient, quantity])).toEqual([
      [COFFEE, 500],
      [MILK, 666],
    ]);
    const spent = orders.reduce((total, order) => total + order.cost.cents, 0);
    expect(spent).toBeLessThanOrEqual(200000);
  });
});
