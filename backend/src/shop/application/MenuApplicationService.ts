import type { DrinkName } from '../domain/menu/DrinkName.js';
import type { IngredientName } from '../domain/menu/IngredientName.js';
import type { MenuRepository } from '../domain/menu/MenuRepository.js';

export interface DrinkView {
  name: DrinkName;
  costCents: number;
  priceCents: number;
  recipe: { ingredient: IngredientName; quantity: number }[];
}

export class MenuApplicationService {
  constructor(private readonly menuRepository: MenuRepository) {}

  async getMenu(): Promise<DrinkView[]> {
    const menu = await this.menuRepository.get();
    return menu.drinks().map((drink) => ({
      name: drink.name,
      costCents: menu.costOf(drink.name).cents,
      priceCents: menu.priceOf(drink.name).cents,
      recipe: drink.recipe.items.map(({ ingredient, quantity }) => ({ ingredient, quantity })),
    }));
  }
}
