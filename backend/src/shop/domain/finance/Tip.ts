import { Personality } from '../customer/Personality.js';
import type { Customer } from '../customer/Customer.js';
import type { RandomGenerator } from '../customer/RandomGenerator.js';
import { Money } from '../Money.js';

export const MIN_TIP_PERCENT = 10;
export const MAX_TIP_PERCENT = 20;

/** Only the generous customers leave a tip: between 10 and 20 % of the price of their drink. */
export function tipFor(customer: Customer, price: Money, random: RandomGenerator): Money {
  if (customer.personality !== Personality.GENEROUS) {
    return Money.ofCents(0);
  }
  const percent =
    MIN_TIP_PERCENT + Math.floor(random.next() * (MAX_TIP_PERCENT - MIN_TIP_PERCENT + 1));
  return price.percent(percent);
}
