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

  describe('rush hours', () => {
    const rush = { startMinute: 240, durationMinutes: 120, multiplier: 2.5 };
    const withRush = () => Calendar.start(480, 8, [rush]);
    const types = (events: { type: string }[]) => events.map((event) => event.type);

    it('is a normal day without rush hour', () => {
      const calendar = newCalendar();
      calendar.advance(300);

      expect(calendar.arrivalMultiplier).toBe(1);
    });

    it('makes the customers arrive more often during the rush hour only', () => {
      const calendar = withRush();

      calendar.advance(239);
      expect(calendar.arrivalMultiplier).toBe(1);
      calendar.advance(1);
      expect(calendar.arrivalMultiplier).toBe(2.5);
      calendar.advance(119);
      expect(calendar.arrivalMultiplier).toBe(2.5);
      calendar.advance(1);
      expect(calendar.arrivalMultiplier).toBe(1);
    });

    it('announces the start and the end of the rush hour once', () => {
      const calendar = withRush();

      expect(types(calendar.advance(200))).toEqual(['clock-tick']);
      expect(calendar.advance(50)).toEqual([
        { type: 'rush-hour-started', multiplier: 2.5 },
        { type: 'clock-tick', day: 1, minuteOfDay: 250, time: '12:10' },
      ]);
      expect(types(calendar.advance(10))).toEqual(['clock-tick']);
      expect(types(calendar.advance(100))).toEqual(['rush-hour-ended', 'clock-tick']);
      expect(types(calendar.advance(10))).toEqual(['clock-tick']);
    });

    it('announces a rush hour that starts when the shop opens', () => {
      const calendar = Calendar.start(480, 8, [
        { startMinute: 0, durationMinutes: 60, multiplier: 2 },
      ]);

      expect(types(calendar.advance(1))).toEqual(['rush-hour-started', 'clock-tick']);
    });

    it('ends a rush hour that lasts until the end of the day before the day ends', () => {
      const calendar = Calendar.start(480, 8, [
        { startMinute: 400, durationMinutes: 80, multiplier: 2 },
      ]);
      calendar.advance(470);

      expect(types(calendar.advance(15))).toEqual([
        'rush-hour-ended',
        'day-ended',
        'day-started',
        'clock-tick',
      ]);
      expect(calendar.arrivalMultiplier).toBe(1);
    });

    it('starts the rush hour again every day', () => {
      const calendar = Calendar.start(480, 8, [
        { startMinute: 0, durationMinutes: 60, multiplier: 2 },
      ]);
      calendar.advance(1);
      calendar.advance(100);

      expect(types(calendar.advance(400))).toEqual([
        'day-ended',
        'day-started',
        'rush-hour-started',
        'clock-tick',
      ]);
    });

    it('can have several rush hours in a day, given in any order', () => {
      const evening = { startMinute: 400, durationMinutes: 60, multiplier: 3 };
      const calendar = Calendar.start(480, 8, [evening, rush]);

      calendar.advance(250);
      expect(calendar.arrivalMultiplier).toBe(2.5);
      calendar.advance(150);
      expect(calendar.arrivalMultiplier).toBe(3);
    });

    it('accepts rush hours that follow each other', () => {
      expect(() =>
        Calendar.start(480, 8, [
          { startMinute: 0, durationMinutes: 60, multiplier: 2 },
          { startMinute: 60, durationMinutes: 60, multiplier: 3 },
        ]),
      ).not.toThrow();
    });

    it.each([
      [{ ...rush, startMinute: -1 }],
      [{ ...rush, startMinute: 1.5 }],
      [{ ...rush, durationMinutes: 0 }],
      [{ ...rush, durationMinutes: 1.5 }],
      [{ ...rush, multiplier: 0 }],
      [{ ...rush, multiplier: Number.NaN }],
      [{ ...rush, startMinute: 400 }],
    ])('rejects the rush hour %j', (invalid) => {
      expect(() => Calendar.start(480, 8, [invalid])).toThrow(InvalidCalendarError);
    });

    it('rejects rush hours that overlap', () => {
      expect(() =>
        Calendar.start(480, 8, [rush, { startMinute: 300, durationMinutes: 60, multiplier: 2 }]),
      ).toThrow('Rush hours cannot overlap');
    });
  });
});
