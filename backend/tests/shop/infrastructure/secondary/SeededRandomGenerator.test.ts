import { describe, expect, it } from 'vitest';
import { SeededRandomGenerator } from '../../../../src/shop/infrastructure/secondary/SeededRandomGenerator.js';

const draw = (seed: number, count: number) => {
  const random = new SeededRandomGenerator(seed);
  return Array.from({ length: count }, () => random.next());
};

describe('SeededRandomGenerator', () => {
  it('gives the same sequence for the same seed', () => {
    expect(draw(42, 20)).toEqual(draw(42, 20));
  });

  it('gives another sequence for another seed', () => {
    expect(draw(42, 20)).not.toEqual(draw(43, 20));
  });

  it('only gives numbers from 0 (included) to 1 (excluded), evenly spread', () => {
    const numbers = draw(1, 10000);

    expect(numbers.every((value) => value >= 0 && value < 1)).toBe(true);
    const mean = numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });

  it('accepts a seed larger than 32 bits', () => {
    expect(draw(Date.now(), 3)).toHaveLength(3);
  });
});
