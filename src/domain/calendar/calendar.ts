/**
 * The learner's calendar: a weekly timetable that repeats through each semester, and
 * one-off important dates (quizzes, tests, exams, deadlines). Pure so it can be tested
 * without a browser; days are local "YYYY-MM-DD" keys throughout.
 */
import type { ClassKind, ClockTime, DatedSemester, DayKey, ImportantDateKind, ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { addDays, parseDayKey } from '@/lib/dates';

export const WEEKDAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 7, label: 'Sunday', short: 'Sun' },
] as const;

export const CLASS_KIND_LABELS: Record<ClassKind, string> = {
  lecture: 'Lecture',
  lab: 'Lab',
};

export const IMPORTANT_KIND_LABELS: Record<ImportantDateKind, string> = {
  quiz: 'Quiz',
  test: 'Test',
  midterm: 'Midterm',
  final: 'Final exam',
  assignment: 'Assignment due',
  'extra-class': 'Extra or make-up class',
  other: 'Other',
};

/** The kind as a short name, for tags and default titles ("CMPD363 Extra class"). */
export const importantKindShortLabel = (kind: ImportantDateKind) => (kind === 'extra-class' ? 'Extra class' : IMPORTANT_KIND_LABELS[kind]);

/** A date's title when the learner leaves it empty: "CMPD363 Midterm" or "CMPD363 Extra class", or just the kind. */
export const defaultDateTitle = (kind: ImportantDateKind, subjectCode?: string) => (subjectCode ? `${subjectCode} ${importantKindShortLabel(kind)}` : importantKindShortLabel(kind));

const DAY_MS = 86_400_000;

/** Whole days from one day to another (negative when `to` is earlier). */
export function daysBetween(from: DayKey, to: DayKey): number {
  // Rounding absorbs the 23- and 25-hour days around daylight-saving changes.
  return Math.round((parseDayKey(to).getTime() - parseDayKey(from).getTime()) / DAY_MS);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(day: DayKey): number {
  const weekday = parseDayKey(day).getDay();
  return weekday === 0 ? 7 : weekday;
}

/** The Monday of the week containing `day`. */
export function startOfWeek(day: DayKey): DayKey {
  return addDays(day, 1 - isoWeekday(day));
}

/** The seven days of the week containing `day`, Monday first. */
export function weekDays(day: DayKey): DayKey[] {
  const monday = startOfWeek(day);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** Monday-first rows of seven days covering the whole of a month ("YYYY-MM"). */
export function monthGrid(month: string): DayKey[][] {
  const first = `${month}-01`;
  const next = parseDayKey(first);
  next.setMonth(next.getMonth() + 1);
  const last = addDays(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`, -1);
  const rows: DayKey[][] = [];
  for (let monday = startOfWeek(first); monday <= last; monday = addDays(monday, 7)) rows.push(weekDays(monday));
  return rows;
}

/** "YYYY-MM" moved by a number of months. */
export function addMonths(month: string, amount: number): string {
  const date = parseDayKey(`${month}-01`);
  date.setMonth(date.getMonth() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isValidSemester(semester: Pick<SemesterRecord, 'startsOn' | 'endsOn'>): boolean {
  return Boolean(semester.startsOn && semester.endsOn && semester.startsOn <= semester.endsOn);
}

/** True when the semester's first and last day are known (and in order). */
export const isDated = (semester: SemesterRecord | undefined): semester is DatedSemester => !!semester && isValidSemester(semester);

/** Teaching week of the semester (week 1 holds the first day), or undefined outside it. */
export function semesterWeek(day: DayKey, semester: DatedSemester): number | undefined {
  if (day < semester.startsOn || day > semester.endsOn) return undefined;
  return Math.floor(daysBetween(startOfWeek(semester.startsOn), day) / 7) + 1;
}

export function semesterWeekCount(semester: DatedSemester): number {
  return semesterWeek(semester.endsOn, semester) ?? 0;
}

const byStart = (a: { start?: ClockTime }, b: { start?: ClockTime }) => (a.start ?? '').localeCompare(b.start ?? '');

/**
 * Classes that meet on a day: same weekday, and inside their semester when its dates are
 * set (without dates the timetable applies every week).
 */
export function classesOn(day: DayKey, classes: TimetableClassRecord[], semesters: SemesterRecord[]): TimetableClassRecord[] {
  const semesterOf = new Map(semesters.filter(isDated).map((semester) => [semester.term, semester]));
  const weekday = isoWeekday(day);
  return classes
    .filter((entry) => {
      const semester = semesterOf.get(entry.term);
      return entry.weekday === weekday && (!semester || (day >= semester.startsOn && day <= semester.endsOn));
    })
    .sort(byStart);
}

export function datesOn(day: DayKey, dates: ImportantDateRecord[]): ImportantDateRecord[] {
  return dates.filter((entry) => entry.date === day).sort(byStart);
}

const chronological = (a: ImportantDateRecord, b: ImportantDateRecord) => a.date.localeCompare(b.date) || byStart(a, b);

/** Dates from today on, soonest first; `withinDays` limits how far ahead. */
export function upcomingDates(dates: ImportantDateRecord[], today: DayKey, withinDays?: number): ImportantDateRecord[] {
  const until = withinDays === undefined ? undefined : addDays(today, withinDays);
  return dates.filter((entry) => entry.date >= today && (!until || entry.date <= until)).sort(chronological);
}

/** Dates before today, most recent first. */
export function pastDates(dates: ImportantDateRecord[], today: DayKey): ImportantDateRecord[] {
  return dates.filter((entry) => entry.date < today).sort((a, b) => chronological(b, a));
}

const minutesOf = (time: ClockTime) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const isValidTimeRange = (start: ClockTime, end: ClockTime) => Boolean(start && end) && minutesOf(end) > minutesOf(start);

/** Ids of classes that overlap another class in the same term on the same weekday. */
export function clashingClassIds(classes: TimetableClassRecord[]): Set<string> {
  const clashing = new Set<string>();
  classes.forEach((a, index) => {
    for (const b of classes.slice(index + 1)) {
      if (a.term !== b.term || a.weekday !== b.weekday) continue;
      if (minutesOf(a.start) < minutesOf(b.end) && minutesOf(b.start) < minutesOf(a.end)) {
        clashing.add(a.id);
        clashing.add(b.id);
      }
    }
  });
  return clashing;
}

/** "08:00–10:00", "14:30", or "" when no time is set. */
export function timeRangeLabel(start?: ClockTime, end?: ClockTime): string {
  if (!start) return '';
  return end ? `${start}–${end}` : start;
}
