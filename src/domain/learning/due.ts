/**
 * What is due for review. Plain date checks on stored review states, kept apart from the
 * FSRS scheduler (srs.ts) so screens that only count due items do not load it.
 */
import type { ReviewStateRecord } from '@/data/records';

export const isDue = (state: Pick<ReviewStateRecord, 'due'>, now: Date = new Date()) => new Date(state.due) <= now;

export interface DueCount {
  /** "other" for items without a course. */
  courseId: string;
  due: number;
  /** Due before today started. */
  overdue: number;
}

/** Items due now, counted per course, most due first. */
export function dueCountsByCourse(reviews: Pick<ReviewStateRecord, 'due' | 'courseId'>[], now: Date = new Date()): DueCount[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const counts = new Map<string, DueCount>();
  for (const review of reviews) {
    const due = new Date(review.due);
    if (due > now) continue;
    const courseId = review.courseId ?? 'other';
    const entry = counts.get(courseId) ?? { courseId, due: 0, overdue: 0 };
    entry.due++;
    if (due < startOfToday) entry.overdue++;
    counts.set(courseId, entry);
  }
  return [...counts.values()].sort((a, b) => b.due - a.due);
}
