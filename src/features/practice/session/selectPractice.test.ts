import { describe, expect, it } from 'vitest';
import type { AttemptRecord, BookmarkRecord, ReviewStateRecord, TopicMasteryRecord } from '@/data/records';
import { courseSchema } from '@/domain/content/schema';
import type { Course, Skill } from '@/domain/content/types';
import { dueReviewRefs, mistakeRefs, quizItems, resolveRefs, savedRefs, weakSpots, weaknessItems } from './selectPractice';

const source = { origin: 'authored' as const };
const shortQuestion = (id: string, skill: Skill, topics: string[] = []) => ({ id, type: 'short', skill, prompt: id, accepted: ['x'], topics, source });

const course: Course = courseSchema.parse({
  id: 'c1',
  title: 'Course',
  description: '',
  category: 'it',
  difficulty: 'beginner',
  source,
  topics: [
    { id: 't.a', title: 'A' },
    { id: 't.b', title: 'B' },
  ],
  units: [
    {
      id: 'u1',
      title: 'Unit',
      lessons: [
        { id: 'l1', title: 'L1', topics: ['t.a'], source, questions: [shortQuestion('q1', 'recall'), shortQuestion('q2', 'recognize'), shortQuestion('q3', 'recall')] },
        { id: 'l2', title: 'L2', topics: ['t.b'], source, questions: [shortQuestion('q4', 'recall'), shortQuestion('q5', 'apply', ['t.a'])] },
      ],
    },
  ],
  assessments: [
    { id: 'exam', title: 'Exam', kind: 'mock-exam', source, sections: [{ id: 's1', title: 'S', questions: [shortQuestion('x1', 'recall', ['t.a'])] }] },
  ],
});
const courses = new Map([[course.id, course]]);

const attempt = (questionId: string, verdict: AttemptRecord['verdict'], createdAt: string, extra: Partial<AttemptRecord> = {}): AttemptRecord => ({
  id: `${questionId}-${createdAt}`,
  questionId,
  courseId: 'c1',
  questionType: 'short',
  skill: 'recall',
  topics: [],
  mode: 'lesson',
  response: { type: 'short', text: '' },
  verdict,
  score: verdict === 'correct' ? 1 : 0,
  hintsUsed: 0,
  revealed: false,
  selfAssessed: false,
  countsForScheduling: true,
  createdAt,
  ...extra,
});

const review = (itemId: string, due: string, extra: Partial<ReviewStateRecord> = {}): ReviewStateRecord => ({
  itemId,
  courseId: 'c1',
  topics: [],
  due,
  updatedAt: due,
  card: { due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 1, lapses: 0, state: 2 },
  ...extra,
});

describe('dueReviewRefs', () => {
  it('returns due items, most overdue first, up to the limit', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    const reviews = [review('q2', '2026-10-11T08:00:00Z'), review('q1', '2026-10-09T08:00:00Z'), review('q3', '2026-10-12T08:00:00Z'), review('q4', '2026-10-10T08:00:00Z', { courseId: undefined })];
    expect(dueReviewRefs(reviews, now, 10).map((ref) => ref.questionId)).toEqual(['q1', 'q2']);
    expect(dueReviewRefs(reviews, now, 1).map((ref) => ref.questionId)).toEqual(['q1']);
  });
});

describe('mistakeRefs', () => {
  it('keeps questions whose latest answer failed or was revealed', () => {
    const attempts = [
      attempt('q1', 'correct', '2026-10-11T10:00:00Z'),
      attempt('q2', 'incorrect', '2026-10-11T09:00:00Z'),
      attempt('q1', 'incorrect', '2026-10-11T08:00:00Z'),
      attempt('q3', 'correct', '2026-10-11T07:00:00Z', { revealed: true }),
      attempt('q4', 'almost', '2026-10-11T06:00:00Z'),
    ];
    expect(mistakeRefs(attempts, 10).map((ref) => ref.questionId)).toEqual(['q2', 'q3']);
  });
});

describe('savedRefs', () => {
  it('lists saved questions newest first and ignores other bookmarks', () => {
    const bookmarks: BookmarkRecord[] = [
      { key: 'question:q1', type: 'question', id: 'q1', label: '', courseId: 'c1', createdAt: '2026-10-01T00:00:00Z' },
      { key: 'course:c1', type: 'course', id: 'c1', label: '', createdAt: '2026-10-03T00:00:00Z' },
      { key: 'question:q4', type: 'question', id: 'q4', label: '', courseId: 'c1', createdAt: '2026-10-02T00:00:00Z' },
    ];
    expect(savedRefs(bookmarks).map((ref) => ref.questionId)).toEqual(['q4', 'q1']);
  });
});

describe('resolveRefs', () => {
  it('resolves lesson and exam questions and counts missing ones', () => {
    const { items, missing } = resolveRefs(
      [
        { questionId: 'q5', courseId: 'c1' },
        { questionId: 'x1', courseId: 'c1' },
        { questionId: 'gone', courseId: 'c1' },
        { questionId: 'q1', courseId: 'other' },
      ],
      courses,
    );
    expect(items.map((item) => [item.question.id, item.lessonId, item.assessmentId, item.topics])).toEqual([
      ['q5', 'l2', undefined, ['t.a']],
      ['x1', undefined, 'exam', ['t.a']],
    ]);
    expect(missing).toBe(2);
  });
});

describe('weakness practice', () => {
  const mastery = (topicId: string, skill: Skill, ema: number, attempts: number): TopicMasteryRecord => ({
    key: `${topicId}|${skill}`,
    topicId,
    skill,
    courseId: 'c1',
    ema,
    attempts,
    correct: 0,
    lastAttemptAt: '',
  });

  it('picks spots that need practice, weakest first, or every skill of one topic', () => {
    const records = [mastery('t.a', 'recall', 0.3, 3), mastery('t.b', 'recall', 0.5, 2), mastery('t.a', 'recognize', 0.95, 4), mastery('t.b', 'apply', 0.2, 1)];
    expect(weakSpots(records).map((spot) => `${spot.topicId}|${spot.skill}`)).toEqual(['t.a|recall', 't.b|recall']);
    expect(weakSpots(records, { topicId: 't.a' }).map((spot) => spot.skill)).toEqual(['recall', 'recognize']);
  });

  it('orders a spot by weak skill, then failed, unanswered and passed questions, and skips exam copies', () => {
    const spots = [{ topicId: 't.a', skill: 'recall' as const, courseId: 'c1', score: 0.3, attempts: 3 }];
    const attempts = [attempt('q1', 'correct', '2026-10-11T10:00:00Z'), attempt('q3', 'incorrect', '2026-10-11T09:00:00Z')];
    expect(weaknessItems(spots, courses, attempts).map((item) => item.question.id)).toEqual(['q3', 'q1', 'q2', 'q5']);
  });

  it('interleaves spots and respects the limit', () => {
    const spots = [
      { topicId: 't.a', skill: 'recall' as const, courseId: 'c1', score: 0.3, attempts: 3 },
      { topicId: 't.b', skill: 'recall' as const, courseId: 'c1', score: 0.4, attempts: 3 },
    ];
    expect(weaknessItems(spots, courses, [], { limit: 3 }).map((item) => item.question.id)).toEqual(['q1', 'q4', 'q3']);
  });
});

describe('quizItems', () => {
  it('samples distinct lesson questions, limited to the given lessons', () => {
    const all = quizItems(course, { count: 10, random: () => 0.5 });
    expect(all).toHaveLength(5);
    expect(new Set(all.map((item) => item.question.id)).size).toBe(5);
    expect(quizItems(course, { count: 10, lessonIds: new Set(['l2']) }).map((item) => item.question.id).sort()).toEqual(['q4', 'q5']);
    expect(quizItems(course, { count: 2 })).toHaveLength(2);
  });

  it('offers the multiple-choice questions of the subject’s tier, and every other question', () => {
    const choice = (id: string, tier?: string) => ({ id, type: 'choice', skill: 'recognize', prompt: id, options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: ['a'], tier, source });
    const tiered = courseSchema.parse({
      ...course,
      units: [{ id: 'u1', title: 'Unit', lessons: [{ id: 'l1', title: 'L1', source, questions: [choice('easy', 'easy'), choice('medium', 'medium'), choice('hard', 'hard'), choice('untiered'), shortQuestion('typed', 'recall')] }] }],
      assessments: [],
    });
    const ids = (tiers: Record<string, 'easy' | 'medium' | 'hard'>) => quizItems(tiered, { count: 10, tiers }).map((item) => item.question.id).sort();
    expect(ids({})).toEqual(['medium', 'typed', 'untiered']);
    expect(ids({ c1: 'hard' })).toEqual(['hard', 'typed', 'untiered']);
    expect(ids({ other: 'easy' })).toEqual(['medium', 'typed', 'untiered']);
  });
});
