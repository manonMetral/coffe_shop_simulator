import { describe, expect, it } from 'vitest';
import { Customer } from '../../../../src/shop/domain/customer/Customer.js';
import { Personality } from '../../../../src/shop/domain/customer/Personality.js';
import { InvalidStaffError, ServerUnavailableError } from '../../../../src/shop/domain/errors.js';
import { DrinkName } from '../../../../src/shop/domain/menu/DrinkName.js';
import { Money } from '../../../../src/shop/domain/Money.js';
import { Server } from '../../../../src/shop/domain/staff/Server.js';
import { ServerName } from '../../../../src/shop/domain/staff/ServerName.js';

const customer = (drink = DrinkName.ESPRESSO) => new Customer(1, Personality.RELAXED, drink);
const price = Money.ofCents(520);

describe('Server', () => {
  describe('creation', () => {
    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects the speed %s', (speed) => {
      expect(() => new Server(ServerName.ALICE, speed, [DrinkName.ESPRESSO])).toThrow(
        InvalidStaffError,
      );
    });

    it('needs to master at least one drink', () => {
      expect(() => new Server(ServerName.ALICE, 1, [])).toThrow(InvalidStaffError);
    });

    it('knows which drinks it masters', () => {
      const server = new Server(ServerName.BOB, 1.5, [DrinkName.ESPRESSO, DrinkName.LATTE]);

      expect(server.drinks).toEqual([DrinkName.ESPRESSO, DrinkName.LATTE]);
      expect(server.masters(DrinkName.LATTE)).toBe(true);
      expect(server.masters(DrinkName.TEA)).toBe(false);
      expect(server.speed).toBe(1.5);
    });
  });

  describe('preparing a drink', () => {
    it('is idle without an order at the start', () => {
      const server = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);

      expect(server.isIdle()).toBe(true);
      expect(server.order).toBeNull();
    });

    it('prepares faster when it is faster', () => {
      const normal = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);
      const fast = new Server(ServerName.BOB, 2, [DrinkName.ESPRESSO]);

      expect(normal.prepare(1, customer(), price, 4).preparationMinutes).toBe(4);
      expect(fast.prepare(2, customer(), price, 4).preparationMinutes).toBe(2);
    });

    it('is busy with the order it prepares', () => {
      const server = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);

      const order = server.prepare(7, customer(), price, 2);

      expect(server.isIdle()).toBe(false);
      expect(server.order).toBe(order);
      expect(order).toMatchObject({
        id: 7,
        server: ServerName.ALICE,
        price,
        drink: DrinkName.ESPRESSO,
      });
    });

    it('refuses a second order while it is busy', () => {
      const server = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);
      server.prepare(1, customer(), price, 2);

      expect(() => server.prepare(2, customer(), price, 2)).toThrow(ServerUnavailableError);
    });

    it('refuses a drink it does not master', () => {
      const server = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);

      expect(() => server.prepare(1, customer(DrinkName.LATTE), price, 4)).toThrow(
        'Alice does not know how to prepare Latte',
      );
    });
  });

  describe('working', () => {
    it('does nothing while it is idle', () => {
      expect(new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]).work(5)).toBeNull();
    });

    it('delivers the order once its preparation is over, and becomes free again', () => {
      const server = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);
      const order = server.prepare(1, customer(), price, 2);

      expect(server.work(1.5)).toBeNull();
      expect(order.remainingMinutes).toBeCloseTo(0.5);
      expect(server.isIdle()).toBe(false);

      expect(server.work(0.5)).toBe(order);
      expect(server.isIdle()).toBe(true);
      expect(server.order).toBeNull();
    });

    it('delivers the order even when the time that goes by exceeds the preparation', () => {
      const server = new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO]);
      const order = server.prepare(1, customer(), price, 2);

      expect(server.work(10)).toBe(order);
      expect(order.remainingMinutes).toBe(0);
    });
  });
});
