import { describe, expect, it } from 'vitest';
import {
  InsufficientStockError,
  InvalidInventoryError,
  UnknownIngredientError,
} from '../../../../src/shop/domain/errors.js';
import { Inventory } from '../../../../src/shop/domain/inventory/Inventory.js';
import { IngredientName } from '../../../../src/shop/domain/menu/IngredientName.js';
import { Recipe } from '../../../../src/shop/domain/menu/Recipe.js';
import { espressoRecipe, latteRecipe } from '../../testMenu.js';

const { COFFEE, MILK, TEA } = IngredientName;

const fullInventory = () => Inventory.full([COFFEE, MILK], 1000, 100);

describe('Inventory', () => {
  describe('creation', () => {
    it('starts with every ingredient at full capacity', () => {
      const inventory = fullInventory();

      expect(inventory.levels()).toEqual([
        { ingredient: COFFEE, quantity: 1000 },
        { ingredient: MILK, quantity: 1000 },
      ]);
      expect(inventory.capacity).toBe(1000);
      expect(inventory.alertThreshold).toBe(100);
    });

    it.each([0, -5, 10.5])('rejects the capacity %s', (capacity) => {
      expect(() => Inventory.full([COFFEE], capacity, 0)).toThrow(InvalidInventoryError);
    });

    it.each([-1, 1000, 2000, 1.5])('rejects the alert threshold %s', (threshold) => {
      expect(() => Inventory.full([COFFEE], 1000, threshold)).toThrow(InvalidInventoryError);
    });
  });

  describe('quantities', () => {
    it('rejects an ingredient that is not stocked', () => {
      expect(() => fullInventory().quantityOf(TEA)).toThrow(UnknownIngredientError);
    });

    it('is low once the stock reaches the alert threshold', () => {
      const inventory = Inventory.full([COFFEE], 102, 100);

      expect(inventory.isLow(COFFEE)).toBe(false);
      inventory.consume(espressoRecipe);
      expect(inventory.quantityOf(COFFEE)).toBe(100);
      expect(inventory.isLow(COFFEE)).toBe(true);
    });
  });

  describe('canPrepare', () => {
    it('is true when every ingredient is available', () => {
      expect(fullInventory().canPrepare(latteRecipe)).toBe(true);
    });

    it('is false when an ingredient is missing', () => {
      const inventory = Inventory.full([COFFEE, MILK], 1, 0);

      expect(inventory.canPrepare(latteRecipe)).toBe(false);
    });
  });

  describe('consume', () => {
    it('depletes the stock according to the recipe', () => {
      const inventory = fullInventory();

      inventory.consume(latteRecipe);

      expect(inventory.quantityOf(COFFEE)).toBe(998);
      expect(inventory.quantityOf(MILK)).toBe(999);
    });

    it('refuses to consume without enough stock, and leaves the stock untouched', () => {
      const inventory = Inventory.full([COFFEE, MILK], 2, 0);

      expect(() => inventory.consume(new Recipe([{ ingredient: MILK, quantity: 3 }]))).toThrow(
        InsufficientStockError,
      );
      expect(() =>
        inventory.consume(
          new Recipe([
            { ingredient: COFFEE, quantity: 1 },
            { ingredient: MILK, quantity: 3 },
          ]),
        ),
      ).toThrow('Insufficient stock of Lait: 3 requested, 2 available');
      expect(inventory.quantityOf(COFFEE)).toBe(2);
    });

    it('rejects a recipe using an ingredient that is not stocked', () => {
      expect(() => fullInventory().consume(new Recipe([{ ingredient: TEA, quantity: 1 }]))).toThrow(
        UnknownIngredientError,
      );
    });

    it('alerts once when the stock reaches the threshold', () => {
      const inventory = Inventory.full([COFFEE, MILK], 104, 100);

      expect(inventory.consume(espressoRecipe)).toEqual([]);
      expect(inventory.consume(espressoRecipe)).toEqual([{ ingredient: COFFEE, remaining: 100 }]);
      expect(inventory.consume(espressoRecipe)).toEqual([]);
    });

    it('alerts when the stock crosses the threshold in a single step', () => {
      const inventory = Inventory.full([COFFEE, MILK], 101, 100);

      expect(inventory.consume(espressoRecipe)).toEqual([{ ingredient: COFFEE, remaining: 99 }]);
    });

    it('alerts for every ingredient that reaches the threshold', () => {
      const inventory = Inventory.full([COFFEE, MILK], 101, 100);

      expect(inventory.consume(latteRecipe)).toEqual([
        { ingredient: COFFEE, remaining: 99 },
        { ingredient: MILK, remaining: 100 },
      ]);
    });
  });

  describe('restock', () => {
    it('knows how much room is left in the stock', () => {
      const inventory = Inventory.full([COFFEE, MILK], 1000, 100);
      inventory.consume(espressoRecipe);

      expect(inventory.spaceLeft(COFFEE)).toBe(2);
      expect(inventory.spaceLeft(MILK)).toBe(0);
    });

    it('adds the delivered units to the stock', () => {
      const inventory = Inventory.full([COFFEE, MILK], 1000, 100);
      inventory.consume(new Recipe([{ ingredient: COFFEE, quantity: 500 }]));

      inventory.restock(COFFEE, 300);

      expect(inventory.quantityOf(COFFEE)).toBe(800);
    });

    it('is not low anymore once restocked, so a new alert is possible', () => {
      const inventory = Inventory.full([COFFEE], 1000, 100);
      inventory.consume(new Recipe([{ ingredient: COFFEE, quantity: 900 }]));
      expect(inventory.isLow(COFFEE)).toBe(true);

      inventory.restock(COFFEE, 500);
      expect(inventory.isLow(COFFEE)).toBe(false);

      expect(inventory.consume(new Recipe([{ ingredient: COFFEE, quantity: 500 }]))).toEqual([
        { ingredient: COFFEE, remaining: 100 },
      ]);
    });

    it.each([0, -3, 1.5])('rejects %s units', (quantity) => {
      const inventory = fullInventory();
      inventory.consume(espressoRecipe);

      expect(() => inventory.restock(COFFEE, quantity)).toThrow(InvalidInventoryError);
    });

    it('cannot store more than the capacity', () => {
      const inventory = fullInventory();
      inventory.consume(espressoRecipe);

      expect(() => inventory.restock(COFFEE, 3)).toThrow(
        'Not enough room to store 3 units of Café',
      );
      expect(inventory.quantityOf(COFFEE)).toBe(998);
    });

    it('rejects an ingredient that is not stocked', () => {
      expect(() => fullInventory().restock(TEA, 1)).toThrow(UnknownIngredientError);
    });
  });
});
