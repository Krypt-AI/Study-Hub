/** Study streaks and daily-goal progress derived from daily activity records. */
import type { ActivityDayRecord, DayKey, Settings } from '@/data/records';
import { addDays, dayKey } from '@/lib/dates';

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
