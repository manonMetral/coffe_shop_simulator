import { describe, expect, it } from 'vitest';
import {
  PERSONALITY_PROFILES,
  Personality,
} from '../../../../src/shop/domain/customer/Personality.js';

describe('Personality', () => {
  it('has a profile for each of the 4 personalities', () => {
    expect(Object.values(Personality)).toEqual(['Pressé', 'Décontracté', 'Exigeant', 'Généreux']);
    for (const personality of Object.values(Personality)) {
      expect(PERSONALITY_PROFILES[personality].patienceMinutes).toBeGreaterThan(0);
    }
  });

  it('makes the rushed customers the least patient and the relaxed ones the most patient', () => {
    const patience = Object.values(Personality).map(
      (personality) => PERSONALITY_PROFILES[personality].patienceMinutes,
    );

    expect(PERSONALITY_PROFILES[Personality.RUSHED].patienceMinutes).toBe(Math.min(...patience));
    expect(PERSONALITY_PROFILES[Personality.RELAXED].patienceMinutes).toBe(Math.max(...patience));
  });
});
