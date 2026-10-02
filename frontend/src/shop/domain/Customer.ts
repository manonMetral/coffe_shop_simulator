export type Personality = 'Pressé' | 'Décontracté' | 'Exigeant' | 'Généreux';

export type DrinkName = 'Espresso' | 'Thé' | 'Latte';

/** A customer waiting in the queue. */
export interface Customer {
  readonly id: number;
  readonly personality: Personality;
  readonly drink: DrinkName;
  /** Simulated minutes the customer accepts to wait. */
  readonly patienceMinutes: number;
  readonly waitedMinutes: number;
}
