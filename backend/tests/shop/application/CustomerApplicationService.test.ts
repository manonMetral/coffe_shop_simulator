import { describe, expect, it } from 'vitest';
import { CustomerApplicationService } from '../../../src/shop/application/CustomerApplicationService.js';
import { Customer } from '../../../src/shop/domain/customer/Customer.js';
import type { CustomerGenerator } from '../../../src/shop/domain/customer/CustomerGenerator.js';
import { CustomerQueue } from '../../../src/shop/domain/customer/CustomerQueue.js';
import { Personality } from '../../../src/shop/domain/customer/Personality.js';
import { DrinkName } from '../../../src/shop/domain/menu/DrinkName.js';
import { InMemoryCustomerQueueRepository } from '../../../src/shop/infrastructure/secondary/InMemoryCustomerQueueRepository.js';

function createService(arrivals: Customer[] = []) {
  const queue = new CustomerQueue();
  const generator = { advance: () => arrivals } as unknown as CustomerGenerator;
  const service = new CustomerApplicationService(
    new InMemoryCustomerQueueRepository(queue),
    generator,
  );
  return { service, queue };
}

describe('CustomerApplicationService', () => {
  it('has an empty queue at the start', async () => {
    expect(await createService().service.getQueue()).toEqual([]);
  });

  it('queues the customers who arrive and announces them', async () => {
    const arrival = new Customer(1, Personality.GENEROUS, DrinkName.LATTE);
    const { service } = createService([arrival]);

    const events = await service.advance(1);

    const view = {
      id: 1,
      personality: 'Généreux',
      drink: 'Latte',
      patienceMinutes: 15,
      waitedMinutes: 0,
    };
    expect(events).toEqual([
      { type: 'customer-arrived', customer: view },
      { type: 'queue-updated', queue: [view] },
    ]);
    expect(await service.getQueue()).toEqual([view]);
  });

  it('sends away the customers who lost patience, before announcing the new ones', async () => {
    const arrival = new Customer(2, Personality.RELAXED, DrinkName.TEA);
    const { service, queue } = createService([arrival]);
    queue.enqueue(new Customer(1, Personality.RUSHED, DrinkName.ESPRESSO));

    const events = await service.advance(7);

    expect(events.map((event) => event.type)).toEqual([
      'customer-left',
      'customer-arrived',
      'queue-updated',
    ]);
    expect(events[0]).toEqual({ type: 'customer-left', customerId: 1, reason: 'patience' });
    expect((await service.getQueue()).map((customer) => customer.id)).toEqual([2]);
  });

  it('makes the customers already in the queue wait, and shows the time with one decimal', async () => {
    const { service, queue } = createService();
    queue.enqueue(new Customer(1, Personality.RELAXED, DrinkName.TEA));

    await service.advance(1 / 3);

    expect((await service.getQueue())[0]?.waitedMinutes).toBe(0.3);
  });

  it('only sends a queue update when nothing else happens', async () => {
    const { service } = createService();

    expect(await service.advance(1)).toEqual([{ type: 'queue-updated', queue: [] }]);
  });
});
