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

  /** Share of the patience left when the customer is served, from 0 to 100 percent. */
  satisfactionPercent(): number {
    return Math.round(100 * Math.max(0, 1 - this.waited / this.patienceMinutes));
  }

  hasLostPatience(): boolean {
    return this.waited >= this.patienceMinutes;
  }
}
