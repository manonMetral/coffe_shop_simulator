import type { DrinkName } from '../menu/DrinkName.js';
import { PERSONALITY_PROFILES, type Personality } from './Personality.js';

export class Customer {
  private waited = 0;

  constructor(
    readonly id: number,
    readonly personality: Personality,
    readonly drink: DrinkName,
  ) {}

  get patienceMinutes(): number {
    return PERSONALITY_PROFILES[this.personality].patienceMinutes;
  }

  get waitedMinutes(): number {
    return this.waited;
  }

  /** Simulated minutes before the customer leaves, the lower the more urgent. */
  get remainingPatienceMinutes(): number {
    return this.patienceMinutes - this.waited;
  }

  /** Makes the customer wait, in simulated minutes. */
  wait(minutes: number): void {
    this.waited += minutes;
  }

  hasLostPatience(): boolean {
    return this.waited >= this.patienceMinutes;
  }
}
