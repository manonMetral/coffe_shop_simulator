import type { Customer } from '../customer/Customer.js';
import { InvalidStaffError, ServerUnavailableError } from '../errors.js';
import type { DrinkName } from '../menu/DrinkName.js';
import type { Money } from '../Money.js';
import { Order } from '../order/Order.js';
import type { ServerName } from './ServerName.js';

export class Server {
  private readonly skills: ReadonlySet<DrinkName>;
  private current: Order | null = null;

  /**
   * @param speed 1 is a normal speed, 2 prepares the drinks twice as fast.
   * @param skills the drinks the server knows how to prepare.
   */
  constructor(
    readonly name: ServerName,
    readonly speed: number,
    skills: readonly DrinkName[],
  ) {
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new InvalidStaffError(`Invalid speed for ${name}: ${speed}`);
    }
    if (skills.length === 0) {
      throw new InvalidStaffError(`${name} must master at least one drink`);
    }
    this.skills = new Set(skills);
  }

  get drinks(): DrinkName[] {
    return [...this.skills];
  }

  get order(): Order | null {
    return this.current;
  }

  masters(drink: DrinkName): boolean {
    return this.skills.has(drink);
  }

  isIdle(): boolean {
    return this.current === null;
  }

  /** Starts preparing the drink of a customer. The faster the server, the shorter the preparation. */
  prepare(
    orderId: number,
    customer: Customer,
    price: Money,
    basePreparationMinutes: number,
  ): Order {
    if (!this.isIdle()) {
      throw new ServerUnavailableError(`${this.name} is already preparing a drink`);
    }
    if (!this.masters(customer.drink)) {
      throw new ServerUnavailableError(
        `${this.name} does not know how to prepare ${customer.drink}`,
      );
    }
    this.current = new Order(
      orderId,
      customer,
      this.name,
      price,
      basePreparationMinutes / this.speed,
    );
    return this.current;
  }

  /** Lets the time go by. Returns the order when its preparation is over, and the server is free again. */
  work(minutes: number): Order | null {
    if (!this.current) {
      return null;
    }
    this.current.progress(minutes);
    if (!this.current.isReady()) {
      return null;
    }
    const delivered = this.current;
    this.current = null;
    return delivered;
  }
}
