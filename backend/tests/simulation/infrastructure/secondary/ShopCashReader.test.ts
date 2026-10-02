import { describe, expect, it } from 'vitest';
import { ShopCashReader } from '../../../../src/simulation/infrastructure/secondary/ShopCashReader.js';
import type { TypeScriptFinance } from '../../../../src/shop/infrastructure/primary/TypeScriptFinance.js';

describe('ShopCashReader', () => {
  it('reads the balance through the finance entry point of the shop', async () => {
    const finance = { balanceCents: async () => 4200 } as TypeScriptFinance;

    expect(await new ShopCashReader(finance).balanceCents()).toBe(4200);
  });
});
