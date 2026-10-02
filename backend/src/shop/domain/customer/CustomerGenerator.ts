import type { DrinkName } from '../menu/DrinkName.js';
import { InvalidCustomerFlowError } from '../errors.js';
import { Customer } from './Customer.js';
import { Personality } from './Personality.js';
import type { RandomGenerator } from './RandomGenerator.js';

const PERSONALITIES = Object.values(Personality);

/**
 * Makes customers arrive at random moments (Poisson process): the waiting time before
 * the next arrival follows an exponential law, whose mean is 60 / customersPerHour minutes.
 */
export class CustomerGenerator {
  private nextCustomerId = 1;
  private minutesBeforeNextArrival: number;

  constructor(
    private readonly random: RandomGenerator,
    private readonly drinks: readonly DrinkName[],
    private readonly customersPerHour: number,
  ) {
    if (drinks.length === 0) {
      throw new InvalidCustomerFlowError('Customers need at least one drink to choose from');
    }
    if (!Number.isFinite(customersPerHour) || customersPerHour <= 0) {
      throw new InvalidCustomerFlowError(
        `Invalid arrival rate: ${customersPerHour} customers per hour`,
      );
    }
    this.minutesBeforeNextArrival = this.drawArrivalDelay();
  }

  /**
   * Returns the customers arriving during the given simulated minutes.
   * With an arrival multiplier of 2 (a rush hour), customers arrive twice as often.
   */
  advance(minutes: number, arrivalMultiplier = 1): Customer[] {
    const arrivals: Customer[] = [];
    // A faster arrival rate is the same as letting the time go by faster for the arrivals.
    let remaining = minutes * arrivalMultiplier;
    while (remaining >= this.minutesBeforeNextArrival) {
      remaining -= this.minutesBeforeNextArrival;
      arrivals.push(this.createCustomer());
      this.minutesBeforeNextArrival = this.drawArrivalDelay();
    }
    this.minutesBeforeNextArrival -= remaining;
    return arrivals;
  }

  private drawArrivalDelay(): number {
    // 1 - next() is in (0, 1], so the logarithm is always finite.
    return (-Math.log(1 - this.random.next()) * 60) / this.customersPerHour;
  }

  private createCustomer(): Customer {
    const personality = this.pick(PERSONALITIES);
    const drink = this.pick(this.drinks);
    const customer = new Customer(this.nextCustomerId, personality, drink);
    this.nextCustomerId += 1;
    return customer;
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.random.next() * items.length)] as T;
  }
}
