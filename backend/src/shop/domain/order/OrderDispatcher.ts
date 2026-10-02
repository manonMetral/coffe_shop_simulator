import type { Customer } from '../customer/Customer.js';
import type { CustomerQueue } from '../customer/CustomerQueue.js';
import type { Inventory } from '../inventory/Inventory.js';
import type { StockLow } from '../inventory/StockLow.js';
import type { Menu } from '../menu/Menu.js';
import type { Staff } from '../staff/Staff.js';
import type { Order } from './Order.js';

export interface DispatchResult {
  /** The orders that were just started. */
  readonly started: Order[];
  /** The customers sent away because the ingredients of their drink are missing. */
  readonly turnedAway: Customer[];
  readonly stockAlerts: StockLow[];
}

/**
 * Gives the waiting customers to the idle servers:
 * the customer who is about to lose patience goes first, to the fastest server who knows the drink.
 */
export class OrderDispatcher {
  private nextOrderId = 1;

  dispatch(queue: CustomerQueue, staff: Staff, menu: Menu, inventory: Inventory): DispatchResult {
    const started: Order[] = [];
    const turnedAway: Customer[] = [];
    const stockAlerts: StockLow[] = [];
    const idleServers = staff.idleServers();

    const byUrgency = [...queue.customers()].sort(
      (a, b) => a.remainingPatienceMinutes - b.remainingPatienceMinutes,
    );
    for (const customer of byUrgency) {
      const drink = menu.drink(customer.drink);
      if (!inventory.canPrepare(drink.recipe)) {
        queue.remove(customer);
        turnedAway.push(customer);
        continue;
      }

      const skilled = idleServers.filter((server) => server.masters(customer.drink));
      const fastest = skilled.reduce<(typeof skilled)[number] | undefined>(
        (best, server) => (best === undefined || server.speed > best.speed ? server : best),
        undefined,
      );
      if (!fastest) {
        continue;
      }

      stockAlerts.push(...inventory.consume(drink.recipe));
      queue.remove(customer);
      idleServers.splice(idleServers.indexOf(fastest), 1);
      started.push(
        fastest.prepare(
          this.nextOrderId,
          customer,
          menu.priceOf(customer.drink),
          drink.preparationMinutes,
        ),
      );
      this.nextOrderId += 1;
    }

    return { started, turnedAway, stockAlerts };
  }
}
