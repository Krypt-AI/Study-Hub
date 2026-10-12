import type { DayKey, Timestamp } from '@/data/records';

export const nowIso = (): Timestamp => new Date().toISOString();

/** Local calendar day as "YYYY-MM-DD" (streaks follow the learner's own day, not UTC). */
export function dayKey(date: Date = new Date()): DayKey {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDayKey(day: DayKey): Date {
  const [year = 1970, month = 1, date = 1] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

export function addDays(day: DayKey, amount: number): DayKey {
  const date = parseDayKey(day);
  date.setDate(date.getDate() + amount);
  return dayKey(date);
}

const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "in 3 days", "2 hours ago", "now". */
export function relativeTime(target: Timestamp | Date, now: Date = new Date()): string {
  const seconds = Math.round((new Date(target).getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit);
  }
  return 'now';
}

/** A calendar day relative to today: "today", "tomorrow", "in 12 days", "3 days ago". */
export function relativeDay(day: DayKey, today: DayKey = dayKey()): string {
  // Rounding absorbs the 23- and 25-hour days around daylight-saving changes.
  const days = Math.round((parseDayKey(day).getTime() - parseDayKey(today).getTime()) / 86_400_000);
  return relativeFormat.format(days, 'day');
}

export function formatDate(value: Timestamp | Date): string {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
