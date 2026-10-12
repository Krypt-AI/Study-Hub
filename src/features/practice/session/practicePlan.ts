/**
 * What a practice session will ask, decided from the learner's records when it opens.
 * The plan names the courses to load; once they are loaded it resolves to session items.
 */
import type { AttemptRecord, BookmarkRecord, LessonProgressRecord, ReviewStateRecord, Settings, TopicMasteryRecord } from '@/data/records';
import type { Course } from '@/domain/content/types';
import { isDue } from '@/domain/learning/due';
import type { PracticeModeId } from '../practiceModes';
import { dueReviewRefs, mistakeRefs, type QuestionRef, quizItems, resolveRefs, savedRefs, type WeakSpot, weakSpots, weaknessItems } from './selectPractice';
import type { SessionItem } from './usePracticeSession';

export interface LearnerRecords {
  reviews: ReviewStateRecord[];
  mastery: TopicMasteryRecord[];
  /** Newest first. */
  attempts: AttemptRecord[];
  bookmarks: BookmarkRecord[];
  /** Lesson progress in the quiz course. */
  progress: LessonProgressRecord[];
  settings: Settings;
}

export type SessionPlan =
  | { kind: 'refs'; refs: QuestionRef[]; nextDue?: string }
  | { kind: 'weak'; spots: WeakSpot[]; attempts: AttemptRecord[] }
  | { kind: 'quiz'; courseId: string; lessonIds: string[]; count: number }
  | { kind: 'choose-course' };

export const DEFAULT_QUIZ_SIZE = 10;

export function planSession(mode: PracticeModeId, params: URLSearchParams, learner: LearnerRecords, knownCourseIds: ReadonlySet<string>, now = new Date()): SessionPlan {
  const known = <T extends { courseId: string }>(entries: T[]) => entries.filter((entry) => knownCourseIds.has(entry.courseId));
  const limit = learner.settings.reviewSessionSize;
  switch (mode) {
    case 'review': {
      const upcoming = learner.reviews.filter((review) => !isDue(review, now)).sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
      return { kind: 'refs', refs: known(dueReviewRefs(learner.reviews, now, limit)), nextDue: upcoming[0]?.due };
    }
    case 'mistakes':
      return { kind: 'refs', refs: known(mistakeRefs(learner.attempts, limit)) };
    case 'saved':
      return { kind: 'refs', refs: known(savedRefs(learner.bookmarks)) };
    case 'weak':
      return { kind: 'weak', spots: known(weakSpots(learner.mastery, { topicId: params.get('topic') ?? undefined })), attempts: learner.attempts };
    case 'quiz': {
      const courseId = params.get('course');
      if (!courseId || !knownCourseIds.has(courseId)) return { kind: 'choose-course' };
      const count = Math.min(50, Math.max(1, Number(params.get('count')) || DEFAULT_QUIZ_SIZE));
      return { kind: 'quiz', courseId, lessonIds: learner.progress.map((record) => record.lessonId), count };
    }
  }
}

export function courseIdsOf(plan: SessionPlan): string[] {
  switch (plan.kind) {
    case 'refs':
      return [...new Set(plan.refs.map((ref) => ref.courseId))];
    case 'weak':
      return [...new Set(plan.spots.map((spot) => spot.courseId))];
    case 'quiz':
      return [plan.courseId];
    case 'choose-course':
      return [];
  }
}

export function buildItems(plan: SessionPlan, courses: ReadonlyMap<string, Course>): { items: SessionItem[]; missing: number } {
  switch (plan.kind) {
    case 'refs':
      return resolveRefs(plan.refs, courses);
    case 'weak':
      return { items: weaknessItems(plan.spots, courses, plan.attempts), missing: 0 };
    case 'quiz': {
      const course = courses.get(plan.courseId);
      return { items: course ? quizItems(course, { count: plan.count, lessonIds: new Set(plan.lessonIds) }) : [], missing: 0 };
    }
    case 'choose-course':
      return { items: [], missing: 0 };
  }
}
