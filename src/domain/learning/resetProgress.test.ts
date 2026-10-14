import { describe, expect, it } from 'vitest';
import { LocalRepository } from '@/data/local/LocalRepository';
import type { ReviewStateRecord } from '@/data/records';
import { resetLessons } from './resetProgress';

const review = (itemId: string): ReviewStateRecord => ({
  itemId,
  topics: [],
  due: '2026-10-14T00:00:00Z',
  updatedAt: 'a',
  card: { due: '2026-10-14T00:00:00Z', stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2 },
});
const progress = (lessonId: string) => ({ lessonId, courseId: 'c', status: 'completed' as const, answeredQuestionIds: ['q1'], correctQuestionIds: ['q1'], lastBlockIndex: 0, startedAt: 'a', updatedAt: 'a' });

describe('resetting a chapter', () => {
  it('clears its lessons’ progress and reviews, and leaves other lessons alone', async () => {
    const repository = new LocalRepository('reset-chapter');
    await repository.saveLessonProgress(progress('l1'));
    await repository.saveLessonProgress(progress('l2'));
    for (const id of ['q1', 'q2', 'q3']) await repository.saveReviewState(review(id));

    await resetLessons(repository, [{ lessonId: 'l1', questionIds: ['q1', 'q2'] }]);

    expect((await repository.listLessonProgress()).map((record) => record.lessonId)).toEqual(['l2']);
    expect((await repository.listReviewStates()).map((record) => record.itemId)).toEqual(['q3']);
    repository.close();
  });
});
