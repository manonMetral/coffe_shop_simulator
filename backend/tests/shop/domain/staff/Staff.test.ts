import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import { InvalidStaffError } from '../../../../src/shop/domain/errors.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { Server } from '../../../../src/shop/domain/staff/Server.js';
import { ServerName } from '../../../../src/shop/domain/staff/ServerName.js';
import { Staff } from '../../../../src/shop/domain/staff/Staff.js';

const server = (name: ServerName) => new Server(name, 1, [DrinkName.ESPRESSO]);

describe('Staff', () => {
  it('needs at least one server', () => {
    expect(() => new Staff([])).toThrow(InvalidStaffError);
  });

  it('refuses two servers with the same name', () => {
    expect(() => new Staff([server(ServerName.ALICE), server(ServerName.ALICE)])).toThrow(
      InvalidStaffError,
    );
  });

  it('lists its servers', () => {
    const alice = server(ServerName.ALICE);
    const bob = server(ServerName.BOB);

    expect(new Staff([alice, bob]).servers()).toEqual([alice, bob]);
  });

  it('lists the servers who are not busy', () => {
    const alice = server(ServerName.ALICE);
    const bob = server(ServerName.BOB);
    bob.prepare(1, new Customer(1, Personality.RUSHED, DrinkName.ESPRESSO), Money.ofCents(500), 2);

    expect(new Staff([alice, bob]).idleServers()).toEqual([alice]);
  });
});
