export enum Personality {
  RUSHED = 'Pressé',
  RELAXED = 'Décontracté',
  DEMANDING = 'Exigeant',
  GENEROUS = 'Généreux',
}

export interface PersonalityProfile {
  /** Simulated minutes a customer of this personality accepts to wait before leaving. */
  readonly patienceMinutes: number;
}

export const PERSONALITY_PROFILES: Readonly<Record<Personality, PersonalityProfile>> = {
  [Personality.RUSHED]: { patienceMinutes: 6 },
  [Personality.DEMANDING]: { patienceMinutes: 12 },
  [Personality.GENEROUS]: { patienceMinutes: 15 },
  [Personality.RELAXED]: { patienceMinutes: 25 },
};
