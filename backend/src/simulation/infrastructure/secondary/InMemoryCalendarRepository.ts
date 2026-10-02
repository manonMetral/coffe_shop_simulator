import type { Calendar } from '../../domain/Calendar.js';
import type { CalendarRepository } from '../../domain/CalendarRepository.js';

export class InMemoryCalendarRepository implements CalendarRepository {
  constructor(private calendar: Calendar) {}

  async get(): Promise<Calendar> {
    return this.calendar;
  }

  async save(calendar: Calendar): Promise<void> {
    this.calendar = calendar;
  }
}
