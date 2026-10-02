import type { DrinkName, Personality } from '../../domain/Customer';
import type { ServerName } from '../../domain/Server';
import type { IngredientName } from '../../domain/Stock';

export const PERSONALITY_SYMBOLS: Record<Personality, string> = {
  Pressé: '🏃',
  Décontracté: '😎',
  Exigeant: '🧐',
  Généreux: '🤗',
};

export const DRINK_SYMBOLS: Record<DrinkName, string> = {
  Espresso: '☕',
  Thé: '🍵',
  Latte: '🥛',
};

export const INGREDIENT_SYMBOLS: Record<IngredientName, string> = {
  Café: '🫘',
  Lait: '🥛',
  Thé: '🍃',
  Eau: '💧',
};

export const SERVER_SYMBOLS: Record<ServerName, string> = {
  Alice: '👩‍🍳',
  Bob: '👨‍🍳',
  Chloé: '🧑‍🍳',
};
