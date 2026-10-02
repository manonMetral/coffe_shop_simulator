import { describe, expect, it } from 'vitest';
import { Calendar } from '../../../../src/simulation/domain/Calendar.js';
import { InMemoryCalendarRepository } from '../../../../src/simulation/infrastructure/secondary/InMemoryCalendarRepository.js';

describe('InMemoryCalendarRepository', () => {
  it('returns the calendar it was created with', async () => {
    const calendar = Calendar.start(480, 8);

    expect(await new InMemoryCalendarRepository(calendar).get()).toBe(calendar);
  });

  it('replaces the calendar on save', async () => {
    const repository = new InMemoryCalendarRepository(Calendar.start(480, 8));
    const other = Calendar.start(240, 9);

    await repository.save(other);

    expect(await repository.get()).toBe(other);
  });
});
