/** Study streaks and daily-goal progress derived from daily activity records. */
import type { ActivityDayRecord, DayKey, Settings } from '@/data/records';
import { addDays, dayKey, parseDayKey } from '@/lib/dates';

export function isActiveDay(day: Pick<ActivityDayRecord, 'minutes' | 'attempts' | 'lessonsCompleted' | 'codeRuns'>): boolean {
  return day.attempts > 0 || day.minutes >= 1 || day.lessonsCompleted > 0 || day.codeRuns > 0;
}

export interface StreakSummary {
  current: number;
  longest: number;
  /** Today has activity already (otherwise the current streak is still alive from yesterday). */
  activeToday: boolean;
}

export function computeStreak(days: ActivityDayRecord[], today: DayKey = dayKey()): StreakSummary {
  const active = new Set(days.filter(isActiveDay).map((day) => day.day));
  const activeToday = active.has(today);

  let current = 0;
  for (let cursor = activeToday ? today : addDays(today, -1); active.has(cursor); cursor = addDays(cursor, -1)) current++;

  let longest = 0;
  let run = 0;
  let previous: DayKey | undefined;
  for (const day of [...active].sort()) {
    run = previous && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return { current, longest, activeToday };
}

export interface GoalProgress {
  minutes: number;
  minutesGoal: number;
  questions: number;
  questionsGoal: number;
  /** 0..1: the better of the two goals, so either way of studying counts. */
  ratio: number;
}

export function dailyGoalProgress(day: ActivityDayRecord | undefined, settings: Settings): GoalProgress {
  const minutes = Math.round(day?.minutes ?? 0);
  const questions = day?.attempts ?? 0;
  const ratio = Math.min(1, Math.max(minutes / settings.dailyGoalMinutes, questions / settings.dailyGoalQuestions));
  return { minutes, minutesGoal: settings.dailyGoalMinutes, questions, questionsGoal: settings.dailyGoalQuestions, ratio };
}

/** How much a day held: nothing, some study, or the daily goal met. */
export type ActivityLevel = 'none' | 'some' | 'goal';

export interface CalendarDayActivity {
  day: DayKey;
  level: ActivityLevel;
  minutes: number;
  answers: number;
  /** After today: shown blank. */
  future: boolean;
}

/** `weeks` weeks of days, Monday first, ending with the week that holds `today`: one array per week. */
export function activityWeeks(days: ActivityDayRecord[], settings: Settings, today: DayKey = dayKey(), weeks = 12): CalendarDayActivity[][] {
  const byDay = new Map(days.map((day) => [day.day, day]));
  const sinceMonday = (parseDayKey(today).getDay() + 6) % 7;
  const first = addDays(today, -sinceMonday - 7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const day = addDays(first, week * 7 + weekday);
      const record = byDay.get(day);
      const level: ActivityLevel = !record || !isActiveDay(record) ? 'none' : dailyGoalProgress(record, settings).ratio >= 1 ? 'goal' : 'some';
      return { day, level, minutes: Math.round(record?.minutes ?? 0), answers: record?.attempts ?? 0, future: day > today };
    }),
  );
}
