import type { Customer } from '../domain/customer/Customer.js';
import type { Personality } from '../domain/customer/Personality.js';
import type { DrinkName } from '../domain/menu/DrinkName.js';
import type { IngredientName } from '../domain/menu/IngredientName.js';
import type { Inventory } from '../domain/inventory/Inventory.js';
import type { Order } from '../domain/order/Order.js';
import type { DayReport } from '../domain/report/DayReport.js';
import type { Server } from '../domain/staff/Server.js';
import type { ServerName } from '../domain/staff/ServerName.js';

export interface CustomerView {
  id: number;
  personality: Personality;
  drink: DrinkName;
  patienceMinutes: number;
  waitedMinutes: number;
}

export interface OrderView {
  orderId: number;
  customerId: number;
  personality: Personality;
  drink: DrinkName;
  preparationMinutes: number;
  remainingMinutes: number;
}

export interface ServerView {
  name: ServerName;
  speed: number;
  drinks: DrinkName[];
  order: OrderView | null;
}

export interface StockView {
  ingredient: IngredientName;
  quantity: number;
  capacity: number;
  low: boolean;
}

export interface ShopSnapshot {
  cashCents: number;
  queue: CustomerView[];
  servers: ServerView[];
  inventory: StockView[];
  reports: DayReport[];
}

export type ShopEvent =
  | { type: 'customer-arrived'; customer: CustomerView }
  | { type: 'customer-left'; customerId: number; reason: 'patience' | 'out-of-stock' }
  | {
      type: 'order-started';
      orderId: number;
      customerId: number;
      drink: DrinkName;
      server: ServerName;
    }
  | {
      type: 'order-delivered';
      orderId: number;
      customerId: number;
      drink: DrinkName;
      server: ServerName;
      priceCents: number;
      tipCents: number;
      cashCents: number;
    }
  | { type: 'stock-low'; ingredient: IngredientName; remaining: number }
  | {
      type: 'restock-ordered';
      ingredient: IngredientName;
      quantity: number;
      costCents: number;
      cashCents: number;
    }
  | { type: 'restock-delivered'; ingredient: IngredientName; quantity: number }
  | { type: 'inventory-updated'; inventory: StockView[] }
  | { type: 'day-report'; report: DayReport }
  | { type: 'queue-updated'; queue: CustomerView[] }
  | { type: 'servers-updated'; servers: ServerView[] };

/** Minutes are shown with one decimal. */
const round = (minutes: number) => Math.round(minutes * 10) / 10;

export const toCustomerView = (customer: Customer): CustomerView => ({
  id: customer.id,
  personality: customer.personality,
  drink: customer.drink,
  patienceMinutes: customer.patienceMinutes,
  waitedMinutes: round(customer.waitedMinutes),
});

const toOrderView = (order: Order): OrderView => ({
  orderId: order.id,
  customerId: order.customer.id,
  personality: order.customer.personality,
  drink: order.drink,
  preparationMinutes: round(order.preparationMinutes),
  remainingMinutes: round(order.remainingMinutes),
});

export const toServerView = (server: Server): ServerView => ({
  name: server.name,
  speed: server.speed,
  drinks: server.drinks,
  order: server.order ? toOrderView(server.order) : null,
});

export const toStockViews = (inventory: Inventory): StockView[] =>
  inventory.levels().map(({ ingredient, quantity }) => ({
    ingredient,
    quantity,
    capacity: inventory.capacity,
    low: inventory.isLow(ingredient),
  }));
