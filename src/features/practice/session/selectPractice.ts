/**
 * Choosing questions for sessions outside lessons: due reviews, recent mistakes, saved
 * questions, weak spots and mixed quizzes. Pure functions over learner records and loaded
 * course content, so each choice is testable and stays fixed once a session starts.
 */
import type { AttemptRecord, BookmarkRecord, ReviewStateRecord, TopicMasteryRecord } from '@/data/records';
import { indexQuestions, type QuestionLocation } from '@/domain/content/navigation';
import type { Course, Skill } from '@/domain/content/types';
import { isPassing } from '@/domain/evaluation/types';
import { needsPractice } from '@/domain/learning/mastery';
import { isDue } from '@/domain/learning/due';
import type { SessionItem } from './usePracticeSession';
import { offeredAt, type QuestionTier, tierFor } from '@/domain/learning/tiers';

export interface QuestionRef {
  questionId: string;
  courseId: string;
}

export interface WeakSpot {
  topicId: string;
  skill: Skill;
  courseId: string;
  score: number;
  attempts: number;
}

const indexCache = new WeakMap<Course, Map<string, QuestionLocation>>();

/** Every question of a course by id, computed once per loaded course. */
function questionIndex(course: Course): Map<string, QuestionLocation> {
  let index = indexCache.get(course);
  if (!index) {
    index = indexQuestions(course);
    indexCache.set(course, index);
  }
  return index;
}

const toSessionItem = ({ question, courseId, lessonId, assessmentId, topics }: QuestionLocation): SessionItem => ({
  question,
  courseId,
  lessonId,
  assessmentId,
  topics,
});

const passed = (attempt: AttemptRecord) => isPassing(attempt.verdict) && !attempt.revealed;

/** Latest attempt per question. `attempts` must be newest first, as the repository returns them. */
export function latestAttempts(attempts: AttemptRecord[]): Map<string, AttemptRecord> {
  const latest = new Map<string, AttemptRecord>();
  for (const attempt of attempts) if (!latest.has(attempt.questionId)) latest.set(attempt.questionId, attempt);
  return latest;
}

/** Due items, most overdue first. */
export function dueReviewRefs(reviews: ReviewStateRecord[], now: Date, limit: number): QuestionRef[] {
  return reviews
    .filter((review): review is ReviewStateRecord & { courseId: string } => Boolean(review.courseId) && isDue(review, now))
    .sort((a, b) => Date.parse(a.due) - Date.parse(b.due))
    .slice(0, limit)
    .map((review) => ({ questionId: review.itemId, courseId: review.courseId }));
}

/** Questions whose latest answer was wrong or revealed, newest first. */
export function mistakeRefs(attempts: AttemptRecord[], limit: number): QuestionRef[] {
  return [...latestAttempts(attempts).values()]
    .filter((attempt): attempt is AttemptRecord & { courseId: string } => Boolean(attempt.courseId) && !passed(attempt))
    .slice(0, limit)
    .map((attempt) => ({ questionId: attempt.questionId, courseId: attempt.courseId }));
}

/** Saved questions, newest first. */
export function savedRefs(bookmarks: BookmarkRecord[]): QuestionRef[] {
  return bookmarks
    .filter((bookmark): bookmark is BookmarkRecord & { courseId: string } => bookmark.type === 'question' && Boolean(bookmark.courseId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((bookmark) => ({ questionId: bookmark.id, courseId: bookmark.courseId }));
}

/**
 * Topic-skill pairs to practise, weakest first. Without a topic: the pairs that need
 * practice. With a topic: every practised skill of that topic.
 */
export function weakSpots(mastery: TopicMasteryRecord[], options: { topicId?: string; limit?: number } = {}): WeakSpot[] {
  const { topicId, limit = 6 } = options;
  return mastery
    .filter((record): record is TopicMasteryRecord & { courseId: string } =>
      Boolean(record.courseId) && (topicId ? record.topicId === topicId : needsPractice(record)),
    )
    .sort((a, b) => a.ema - b.ema)
    .slice(0, topicId ? undefined : limit)
    .map((record) => ({ topicId: record.topicId, skill: record.skill, courseId: record.courseId, score: record.ema, attempts: record.attempts }));
}

/** Resolves refs to session items, dropping refs whose question is no longer in its course. */
export function resolveRefs(refs: QuestionRef[], courses: ReadonlyMap<string, Course>): { items: SessionItem[]; missing: number } {
  const items: SessionItem[] = [];
  let missing = 0;
  for (const ref of refs) {
    const course = courses.get(ref.courseId);
    const location = course && questionIndex(course).get(ref.questionId);
    if (location) items.push(toSessionItem(location));
    else missing++;
  }
  return { items, missing };
}

/**
 * Lesson questions only: mock-exam questions repeat lesson items and belong to the exam sitting. Of the
 * multiple-choice questions, only those of the learner's tier for the course.
 */
const lessonQuestions = (course: Course, tiers: Readonly<Record<string, QuestionTier>>) => {
  const tier = tierFor(tiers, course.id);
  return [...questionIndex(course).values()].filter((location) => location.lessonId !== undefined && offeredAt(location.question, tier));
};

/**
 * Questions for weak spots, interleaved so every spot gets practice. Within a spot: questions
 * of the weak skill first, then ones last answered wrong, then unanswered, then the rest
 * (longest since answered first).
 */
export function weaknessItems(
  spots: WeakSpot[],
  courses: ReadonlyMap<string, Course>,
  attempts: AttemptRecord[],
  { tiers = {}, limit = 20 }: { tiers?: Readonly<Record<string, QuestionTier>>; limit?: number } = {},
): SessionItem[] {
  const latest = latestAttempts(attempts);
  const status = (questionId: string) => {
    const attempt = latest.get(questionId);
    if (!attempt) return { order: 1, at: 0 };
    return { order: passed(attempt) ? 2 : 0, at: Date.parse(attempt.createdAt) };
  };

  const queues = spots.map((spot) => {
    const course = courses.get(spot.courseId);
    if (!course) return [];
    return lessonQuestions(course, tiers)
      .filter((location) => location.topics.includes(spot.topicId))
      .map((location) => ({ location, skill: location.question.skill === spot.skill ? 0 : 1, ...status(location.question.id) }))
      .sort((a, b) => a.skill - b.skill || a.order - b.order || a.at - b.at)
      .map(({ location }) => location);
  });
  return interleave(queues, limit).map(toSessionItem);
}

/** Round-robin over the queues, skipping duplicates, up to `limit` items. */
function interleave(queues: QuestionLocation[][], limit: number): QuestionLocation[] {
  const chosen = new Map<string, QuestionLocation>();
  const longest = Math.max(0, ...queues.map((queue) => queue.length));
  for (let position = 0; position < longest && chosen.size < limit; position++) {
    for (const queue of queues) {
      const location = queue[position];
      if (location && !chosen.has(location.question.id)) chosen.set(location.question.id, location);
      if (chosen.size >= limit) break;
    }
  }
  return [...chosen.values()];
}

/** A random set of lesson questions, limited to the given lessons when there are any. */
export function quizItems(
  course: Course,
  options: { count: number; lessonIds?: ReadonlySet<string>; tiers?: Readonly<Record<string, QuestionTier>>; random?: () => number },
): SessionItem[] {
  const { count, lessonIds, tiers = {}, random = Math.random } = options;
  const pool = lessonQuestions(course, tiers).filter((location) => !lessonIds?.size || lessonIds.has(location.lessonId as string));
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap] as QuestionLocation, pool[index] as QuestionLocation];
  }
  return pool.slice(0, count).map(toSessionItem);
}
