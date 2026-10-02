import type { Menu } from '../../domain/menu/Menu.js';
import type { MenuRepository } from '../../domain/menu/MenuRepository.js';

export class InMemoryMenuRepository implements MenuRepository {
  constructor(private readonly menu: Menu) {}

  async get(): Promise<Menu> {
    return this.menu;
  }
}
