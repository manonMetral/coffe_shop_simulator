import { describe, expect, it } from 'vitest';
import { InMemoryMenuRepository } from '../../../../src/shop/infrastructure/secondary/InMemoryMenuRepository.js';
import { createTestMenu } from '../../testMenu.js';

describe('InMemoryMenuRepository', () => {
  it('returns the menu it was created with', async () => {
    const menu = createTestMenu();

    expect(await new InMemoryMenuRepository(menu).get()).toBe(menu);
  });
});
