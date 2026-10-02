import { describe, expect, it } from 'vitest';
import { formatEuros } from './formatEuros';

const normalized = (value: string) => value.replace(/\s/g, ' ');

describe('formatEuros', () => {
  it.each([
    [30000, '300,00 €'],
    [585, '5,85 €'],
    [123456, '1 234,56 €'],
  ])('formats %i cents', (cents, expected) => {
    expect(normalized(formatEuros(cents))).toBe(expected);
  });
});
