import type {
  CustomerApplicationService,
  CustomerEvent,
  CustomerView,
} from '../../application/CustomerApplicationService.js';

/** Entry point of the customers for the other bounded contexts. */
export class TypeScriptCustomers {
  constructor(private readonly customerService: CustomerApplicationService) {}

  advance(simulatedMinutes: number): Promise<CustomerEvent[]> {
    return this.customerService.advance(simulatedMinutes);
  }

  queue(): Promise<CustomerView[]> {
    return this.customerService.getQueue();
  }
}
