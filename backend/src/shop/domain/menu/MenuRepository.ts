import type { Menu } from './Menu.js';

export interface MenuRepository {
  get(): Promise<Menu>;
}
