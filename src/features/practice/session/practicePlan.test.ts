import { describe, expect, it } from 'vitest';
import type { ReviewStateRecord } from '@/data/records';
import { DEFAULT_SETTINGS } from '@/data/records';
import { type LearnerRecords, planSession } from './practicePlan';

const review = (itemId: string, courseId: string, due: string): ReviewStateRecord => ({
  itemId,
  courseId,
  topics: [],
  due,
  updatedAt: due,
  card: { due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2 },
});

const learner: LearnerRecords = {
  reviews: [review('a1', 'cmpd363', '2026-10-01T00:00:00Z'), review('b1', 'hsk-1', '2026-10-01T00:00:00Z'), review('a2', 'cmpd363', '2026-12-01T00:00:00Z')],
  mastery: [],
  attempts: [],
  bookmarks: [],
  progress: [],
  settings: DEFAULT_SETTINGS,
};
const known = new Set(['cmpd363', 'hsk-1']);
const now = new Date('2026-10-14T00:00:00Z');

describe('planning a practice session', () => {
  it('covers every subject without a course', () => {
    const plan = planSession('review', new URLSearchParams(), learner, known, now);
    expect(plan.kind === 'refs' && plan.refs.map((ref) => ref.questionId).sort()).toEqual(['a1', 'b1']);
  });

  it('covers only the chosen subject, and tells when its next review is due', () => {
    const plan = planSession('review', new URLSearchParams({ course: 'cmpd363' }), learner, known, now);
    expect(plan.kind === 'refs' && plan.refs.map((ref) => ref.questionId)).toEqual(['a1']);
    expect(plan.kind === 'refs' && plan.nextDue).toBe('2026-12-01T00:00:00Z');
  });
});
