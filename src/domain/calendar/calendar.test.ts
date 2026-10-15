import { describe, expect, it } from 'vitest';
import type { DatedSemester, ImportantDateRecord, TimetableClassRecord } from '@/data/records';
import {
  classesOn,
  clashingClassIds,
  dateRangeLabel,
  datesOn,
  daysBetween,
  defaultDateTitle,
  isoWeekday,
  isValidTimeRange,
  monthGrid,
  pastDates,
  semesterWeek,
  semesterWeekCount,
  startOfWeek,
  upcomingDates,
  whenLabel,
} from './calendar';

const semester: DatedSemester = { term: 'Sem 1 2026', startsOn: '2026-10-05', endsOn: '2027-01-29', updatedAt: '' };
const lesson = (id: string, weekday: number, start: string, end: string, term = 'Sem 1 2026'): TimetableClassRecord => ({
  id,
  term,
  title: id,
  kind: 'lecture',
  weekday,
  start,
  end,
  createdAt: '',
  updatedAt: '',
});
const important = (id: string, date: string, start?: string): ImportantDateRecord => ({ id, title: id, kind: 'quiz', date, start, createdAt: '', updatedAt: '' });

describe('days and weeks', () => {
  it('numbers weekdays from Monday', () => {
    expect(isoWeekday('2026-10-12')).toBe(1); // a Monday
    expect(isoWeekday('2026-10-18')).toBe(7);
    expect(startOfWeek('2026-10-18')).toBe('2026-10-12');
    expect(daysBetween('2026-10-12', '2026-10-01')).toBe(-11);
  });

  it('lays out a month in Monday-first weeks', () => {
    const october = monthGrid('2026-10');
    expect(october[0]?.[0]).toBe('2026-09-28');
    expect(october.at(-1)?.at(-1)).toBe('2026-11-01');
    expect(october.every((week) => week.length === 7)).toBe(true);
  });

  it('counts teaching weeks from the semester start', () => {
    expect(semesterWeek('2026-10-05', semester)).toBe(1);
    expect(semesterWeek('2026-10-12', semester)).toBe(2);
    expect(semesterWeek('2026-10-04', semester)).toBeUndefined();
    expect(semesterWeekCount(semester)).toBe(17);
  });
});

describe('timetable', () => {
  const classes = [lesson('late', 1, '14:00', '16:00'), lesson('early', 1, '08:00', '10:00'), lesson('tuesday', 2, '08:00', '10:00')];

  it('lists a day’s classes in time order, only inside the semester', () => {
    expect(classesOn('2026-10-12', classes, [semester]).map((entry) => entry.id)).toEqual(['early', 'late']);
    expect(classesOn('2026-09-28', classes, [semester])).toEqual([]);
  });

  it('repeats every week when the semester has no dates', () => {
    expect(classesOn('2026-09-28', classes, []).map((entry) => entry.id)).toEqual(['early', 'late']);
    // A semester the learner added without dates does not bound its classes.
    expect(classesOn('2026-09-28', classes, [{ term: 'Sem 1 2026', updatedAt: '' }]).map((entry) => entry.id)).toEqual(['early', 'late']);
  });

  it('finds overlapping classes in the same term and weekday only', () => {
    const overlapping = [...classes, lesson('clash', 1, '09:00', '11:00'), lesson('back-to-back', 1, '10:00', '12:00'), lesson('other term', 1, '09:00', '11:00', 'Sem 2 2026')];
    expect([...clashingClassIds(overlapping)].sort()).toEqual(['back-to-back', 'clash', 'early']);
  });

  it('requires a class to end after it starts', () => {
    expect(isValidTimeRange('08:00', '10:00')).toBe(true);
    expect(isValidTimeRange('10:00', '10:00')).toBe(false);
  });
});

describe('important dates', () => {
  it('names an untitled date after its subject and kind', () => {
    expect(defaultDateTitle('midterm', 'CMPD363')).toBe('CMPD363 Midterm');
    expect(defaultDateTitle('extra-class', 'CMPD363')).toBe('CMPD363 Extra class');
    expect(defaultDateTitle('extra-class')).toBe('Extra class');
  });

  const dates = [important('final', '2027-01-20'), important('quiz pm', '2026-10-20', '14:00'), important('quiz am', '2026-10-20', '09:00'), important('done', '2026-10-01')];

  it('lists upcoming dates soonest first, optionally within a horizon', () => {
    expect(upcomingDates(dates, '2026-10-12').map((entry) => entry.id)).toEqual(['quiz am', 'quiz pm', 'final']);
    expect(upcomingDates(dates, '2026-10-12', 14).map((entry) => entry.id)).toEqual(['quiz am', 'quiz pm']);
    expect(pastDates(dates, '2026-10-12').map((entry) => entry.id)).toEqual(['done']);
  });
});

describe('events over several days', () => {
  const holiday: ImportantDateRecord = { id: 'break', title: 'Mid-semester break', kind: 'holiday', date: '2026-10-12', endDate: '2026-10-16', createdAt: '', updatedAt: '' };
  const quiz = important('quiz', '2026-10-14', '09:00');

  it('covers every day of the event, listed before the other dates of that day', () => {
    expect(datesOn('2026-10-14', [quiz, holiday]).map((entry) => entry.id)).toEqual(['break', 'quiz']);
    expect(datesOn('2026-10-16', [quiz, holiday]).map((entry) => entry.id)).toEqual(['break']);
    expect(datesOn('2026-10-17', [quiz, holiday])).toEqual([]);
  });

  it('is upcoming while it runs, and past once its last day is over', () => {
    expect(upcomingDates([holiday], '2026-10-15').map((entry) => entry.id)).toEqual(['break']);
    expect(pastDates([holiday], '2026-10-15')).toEqual([]);
    expect(pastDates([holiday], '2026-10-17').map((entry) => entry.id)).toEqual(['break']);
  });

  it('says how long it runs', () => {
    expect(dateRangeLabel(holiday)).toMatch(/^12.16/u);
    expect(whenLabel(holiday, '2026-10-14')).toMatch(/^until /u);
  });
});
