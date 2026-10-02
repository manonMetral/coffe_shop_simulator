import type { Customer } from '../domain/customer/Customer.js';
import type { CustomerGenerator } from '../domain/customer/CustomerGenerator.js';
import type { CustomerQueueRepository } from '../domain/customer/CustomerQueueRepository.js';
import type { DrinkName } from '../domain/menu/DrinkName.js';
import type { Personality } from '../domain/customer/Personality.js';

export interface CustomerView {
  id: number;
  personality: Personality;
  drink: DrinkName;
  patienceMinutes: number;
  waitedMinutes: number;
}

export type CustomerEvent =
  | { type: 'customer-arrived'; customer: CustomerView }
  | { type: 'customer-left'; customerId: number; reason: 'patience' }
  | { type: 'queue-updated'; queue: CustomerView[] };

const toView = (customer: Customer): CustomerView => ({
  id: customer.id,
  personality: customer.personality,
  drink: customer.drink,
  patienceMinutes: customer.patienceMinutes,
  waitedMinutes: Math.round(customer.waitedMinutes * 10) / 10,
});

export class CustomerApplicationService {
  constructor(
    private readonly queueRepository: CustomerQueueRepository,
    private readonly generator: CustomerGenerator,
  ) {}

  async getQueue(): Promise<CustomerView[]> {
    return (await this.queueRepository.get()).customers().map(toView);
  }

  /** Lets the simulated time go by: waiting customers lose patience, new customers arrive. */
  async advance(simulatedMinutes: number): Promise<CustomerEvent[]> {
    const queue = await this.queueRepository.get();
    const left = queue.wait(simulatedMinutes);
    const arrivals = this.generator.advance(simulatedMinutes);
    arrivals.forEach((customer) => queue.enqueue(customer));

    return [
      ...left.map((customer): CustomerEvent => ({
        type: 'customer-left',
        customerId: customer.id,
        reason: 'patience',
      })),
      ...arrivals.map((customer): CustomerEvent => ({
        type: 'customer-arrived',
        customer: toView(customer),
      })),
      { type: 'queue-updated', queue: queue.customers().map(toView) },
    ];
  }
}
