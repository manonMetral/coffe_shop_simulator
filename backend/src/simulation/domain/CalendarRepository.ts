import type { Calendar } from './Calendar.js';

export interface CalendarRepository {
  get(): Promise<Calendar>;
  save(calendar: Calendar): Promise<void>;
}
