import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { LocalRepository } from '@/data/local/LocalRepository';
import type { ActivityDayRecord } from '@/data/records';
import { DEFAULT_SETTINGS } from '@/data/records';
import { questionSchema } from '@/domain/content/schema';
import { evaluateShort } from '@/domain/evaluation/evaluate';
import type { ShortQuestion } from '@/domain/content/types';
import { computeStreak, dailyGoalProgress } from './activity';
import { completeLesson } from './lessonProgress';
import { masteryLevel, updateMastery } from './mastery';
import { recordAnswer } from './recordAnswer';
import { isDue } from './due';
import { ratingFor, scheduleReview } from './srs';

const question = questionSchema.parse({
  id: 'hsk1.l06.q1',
  type: 'short',
  skill: 'recall',
  prompt: 'Meaning of 电脑',
  accepted: ['computer'],
  topics: ['hsk1.vocab'],
  source: { origin: 'user-material', sourceId: 'hsk1-textbook', page: 140 },
}) as ShortQuestion;

describe('ratingFor', () => {
  it('maps feedback and help used to FSRS ratings', () => {
    const correct = { verdict: 'correct' as const, score: 1 };
    expect(ratingFor(correct, { hintsUsed: 0, revealed: false })).toBe(Rating.Good);
    expect(ratingFor(correct, { hintsUsed: 1, revealed: false })).toBe(Rating.Hard);
    expect(ratingFor(correct, { hintsUsed: 0, revealed: true })).toBe(Rating.Again);
    expect(ratingFor({ verdict: 'almost', score: 0.85 }, { hintsUsed: 0, revealed: false })).toBe(Rating.Hard);
    expect(ratingFor({ verdict: 'incorrect', score: 0 }, { hintsUsed: 0, revealed: false })).toBe(Rating.Again);
  });
});

describe('scheduleReview', () => {
  it('schedules a well-known item further out than a failed one', () => {
    const now = new Date('2026-10-11T10:00:00Z');
    const item = { itemId: 'q', topics: [] };
    const good = scheduleReview(undefined, item, Rating.Good, now);
    const again = scheduleReview(undefined, item, Rating.Again, now);
    expect(new Date(good.due).getTime()).toBeGreaterThan(new Date(again.due).getTime());
    expect(isDue(again, new Date('2026-10-12T10:00:00Z'))).toBe(true);
    const second = scheduleReview(good, item, Rating.Good, new Date(good.due));
    expect(second.card.reps).toBe(2);
  });
});

describe('mastery', () => {
  it('moves towards recent scores and classifies levels', () => {
    let record = updateMastery(undefined, { topicId: 't', skill: 'recall', score: 0, passing: false, weight: 'first', at: '' });
    record = updateMastery(record, { topicId: 't', skill: 'recall', score: 0, passing: false, weight: 'first', at: '' });
    expect(masteryLevel(record)).toBe('weak');
    for (let index = 0; index < 6; index++) {
      record = updateMastery(record, { topicId: 't', skill: 'recall', score: 1, passing: true, weight: 'first', at: '' });
    }
    expect(masteryLevel(record)).toBe('mastered');
    expect(masteryLevel(undefined)).toBe('new');
  });

  it('weights same-session retries less than first attempts', () => {
    const start = updateMastery(undefined, { topicId: 't', skill: 'recall', score: 0, passing: false, weight: 'first', at: '' });
    const retry = updateMastery(start, { topicId: 't', skill: 'recall', score: 1, passing: true, weight: 'retry', at: '' });
    const first = updateMastery(start, { topicId: 't', skill: 'recall', score: 1, passing: true, weight: 'first', at: '' });
    expect(retry.ema).toBeLessThan(first.ema);
  });
});

describe('streaks and goals', () => {
  const day = (key: string, attempts: number): ActivityDayRecord => ({
    day: key, minutes: 0, attempts, correct: 0, lessonsCompleted: 0, codeRuns: 0, updatedAt: '',
  });

  it('counts consecutive active days ending today or yesterday', () => {
    const days = [day('2026-10-07', 3), day('2026-10-09', 1), day('2026-10-10', 5)];
    expect(computeStreak(days, '2026-10-11')).toEqual({ current: 2, longest: 2, activeToday: false });
    expect(computeStreak(days, '2026-10-12').current).toBe(0);
  });

  it('reports the better of the minutes and questions goals', () => {
    const progress = dailyGoalProgress({ ...day('2026-10-11', 10), minutes: 6 }, DEFAULT_SETTINGS);
    expect(progress.ratio).toBeCloseTo(0.5);
  });
});

describe('recordAnswer', () => {
  let repository: LocalRepository;

  beforeEach(() => {
    repository = new LocalRepository(`test-${crypto.randomUUID()}`);
  });

  afterEach(() => repository.close());

  const answer = async (text: string, firstAttemptInSession: boolean) =>
    recordAnswer(repository, {
      question,
      topics: question.topics,
      courseId: 'hsk-1',
      lessonId: 'hsk-1.l06',
      mode: 'lesson',
      response: { type: 'short', text },
      feedback: evaluateShort(question, text),
      hintsUsed: 0,
      revealed: false,
      selfAssessed: false,
      firstAttemptInSession,
    });

  it('stores the attempt, schedules a review and updates mastery, activity and lesson progress', async () => {
    const { review } = await answer('computer', true);
    expect(review?.itemId).toBe(question.id);

    const [attempt] = await repository.listAttempts({ questionId: question.id });
    expect(attempt).toMatchObject({ verdict: 'correct', score: 1, countsForScheduling: true });
    expect((await repository.listTopicMastery())[0]).toMatchObject({ topicId: 'hsk1.vocab', attempts: 1, correct: 1 });
    expect((await repository.listActivityDays())[0]).toMatchObject({ attempts: 1, correct: 1 });
    expect(await repository.getLessonProgress('hsk-1.l06')).toMatchObject({ answeredQuestionIds: [question.id], correctQuestionIds: [question.id] });
  });

  it('lets a retry in the same session add practice without moving the schedule', async () => {
    const first = await answer('keyboard', true);
    const retry = await answer('computer', false);
    expect(retry.review).toBeUndefined();
    expect((await repository.getReviewState(question.id))?.due).toBe(first.review?.due);
    expect(await repository.listAttempts()).toHaveLength(2);
  });

  it('counts a completed lesson once', async () => {
    await completeLesson(repository, { courseId: 'hsk-1', lessonId: 'hsk-1.l06' });
    await completeLesson(repository, { courseId: 'hsk-1', lessonId: 'hsk-1.l06' });
    expect((await repository.listActivityDays())[0]?.lessonsCompleted).toBe(1);
  });

  it('round-trips a full backup', async () => {
    await answer('computer', true);
    const backup = await repository.exportAll();
    const other = new LocalRepository(`test-${crypto.randomUUID()}`);
    await other.importAll(backup, 'replace');
    expect(await other.listAttempts()).toHaveLength(1);
    expect(await other.getReviewState(question.id)).toBeDefined();
    other.close();
  });
});
