import { describe, expect, it } from 'vitest';
import { createDefaultMenu } from '../../src/composition/defaultMenu.js';
import { createDefaultStaff } from '../../src/composition/defaultStaff.js';

describe('default staff', () => {
  const staff = createDefaultStaff();

  it('starts with 3 servers', () => {
    expect(staff.servers().map((server) => server.name)).toEqual(['Alice', 'Bob', 'Chloé']);
  });

  it('has at least two servers for every drink of the menu', () => {
    for (const drink of createDefaultMenu().drinks()) {
      const skilled = staff.servers().filter((server) => server.masters(drink.name));
      expect(skilled.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('has a fast server and a slow one', () => {
    const speeds = staff.servers().map((server) => server.speed);

    expect(Math.max(...speeds)).toBeGreaterThan(1);
    expect(Math.min(...speeds)).toBeLessThan(1);
  });
});
