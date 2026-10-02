import { DrinkName } from '../shop/domain/menu/DrinkName.js';
import { Server } from '../shop/domain/staff/Server.js';
import { ServerName } from '../shop/domain/staff/ServerName.js';
import { Staff } from '../shop/domain/staff/Staff.js';

/** The 3 servers the shop starts with: Alice does everything, Bob is fast on coffee, Chloé is slow. */
export function createDefaultStaff(): Staff {
  return new Staff([
    new Server(ServerName.ALICE, 1, [DrinkName.ESPRESSO, DrinkName.TEA, DrinkName.LATTE]),
    new Server(ServerName.BOB, 1.5, [DrinkName.ESPRESSO, DrinkName.LATTE]),
    new Server(ServerName.CHLOE, 0.8, [DrinkName.TEA, DrinkName.LATTE]),
  ]);
}
