import { describe, expect, it } from 'vitest';
import { Calendar } from '../../../src/simulation/domain/Calendar.js';
import { InvalidCalendarError } from '../../../src/simulation/domain/errors.js';

const newCalendar = () => Calendar.start(480, 8);

describe('Calendar', () => {
  describe('creation', () => {
    it.each([0, -1, 1.5, 1441])('rejects the day length %s', (length) => {
      expect(() => Calendar.start(length, 8)).toThrow(InvalidCalendarError);
    });

    it.each([-1, 24, 1.5])('rejects the day start hour %s', (hour) => {
      expect(() => Calendar.start(480, hour)).toThrow(InvalidCalendarError);
    });

    it('starts on day 1 when the shop opens', () => {
      const calendar = newCalendar();

      expect(calendar.day).toBe(1);
      expect(calendar.minuteOfDay).toBe(0);
      expect(calendar.time).toBe('08:00');
      expect(calendar.dayLengthMinutes).toBe(480);
    });
  });

  describe('advance', () => {
    it('moves the time forward and ticks the clock', () => {
      const calendar = newCalendar();

      const events = calendar.advance(90);

      expect(events).toEqual([{ type: 'clock-tick', day: 1, minuteOfDay: 90, time: '09:30' }]);
      expect(calendar.time).toBe('09:30');
    });

    it('accumulates fractions of minutes', () => {
      const calendar = newCalendar();

      calendar.advance(0.6);
      expect(calendar.minuteOfDay).toBe(0);
      calendar.advance(0.6);
      expect(calendar.minuteOfDay).toBe(1);
    });

    it('wraps the time of the day after midnight', () => {
      const calendar = Calendar.start(120, 23);

      calendar.advance(90);

      expect(calendar.time).toBe('00:30');
    });

    it('ends the day and starts the next one exactly when the day length is reached', () => {
      const calendar = newCalendar();

      expect(calendar.advance(480)).toEqual([
        { type: 'day-ended', day: 1 },
        { type: 'day-started', day: 2 },
        { type: 'clock-tick', day: 2, minuteOfDay: 0, time: '08:00' },
      ]);
    });

    it('carries over the minutes exceeding the end of the day', () => {
      const calendar = newCalendar();
      calendar.advance(470);

      const events = calendar.advance(30);

      expect(events.map((event) => event.type)).toEqual(['day-ended', 'day-started', 'clock-tick']);
      expect(calendar.day).toBe(2);
      expect(calendar.minuteOfDay).toBe(20);
    });

    it('goes through several days at once', () => {
      const calendar = newCalendar();

      const events = calendar.advance(1000);

      expect(
        events.filter((event) => event.type === 'day-ended').map((event) => event.day),
      ).toEqual([1, 2]);
      expect(calendar.day).toBe(3);
      expect(calendar.minuteOfDay).toBe(40);
    });

    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects the duration %s', (minutes) => {
      expect(() => newCalendar().advance(minutes)).toThrow(InvalidCalendarError);
    });
  });
});
