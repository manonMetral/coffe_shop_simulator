import type { Customer } from './Customer.js';

/** Customers waiting to be served, in order of arrival. */
export class CustomerQueue {
  private waiting: Customer[] = [];

  customers(): readonly Customer[] {
    return [...this.waiting];
  }

  enqueue(customer: Customer): void {
    this.waiting.push(customer);
  }

  remove(customer: Customer): void {
    this.waiting = this.waiting.filter((waiting) => waiting !== customer);
  }

  /** Makes everyone wait, and returns the customers who lost patience and left the queue. */
  wait(minutes: number): Customer[] {
    for (const customer of this.waiting) {
      customer.wait(minutes);
    }
    const left = this.waiting.filter((customer) => customer.hasLostPatience());
    this.waiting = this.waiting.filter((customer) => !customer.hasLostPatience());
    return left;
  }
}
