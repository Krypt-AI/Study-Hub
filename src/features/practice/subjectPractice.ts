/** What one subject has waiting in Practice: due reviews, weak spots, mistakes and saved questions. */
import type { AttemptRecord, BookmarkRecord, ReviewStateRecord, TopicMasteryRecord } from '@/data/records';
import { isDue } from '@/domain/learning/due';
import { levelCountsBySkill } from '@/domain/learning/mastery';
import { mistakeRefs, savedRefs, type WeakSpot, weakSpots } from './session/selectPractice';

export interface PracticeRecords {
  reviews: ReviewStateRecord[];
  mastery: TopicMasteryRecord[];
  /** Newest first. */
  attempts: AttemptRecord[];
  bookmarks: BookmarkRecord[];
}

export interface SubjectPractice {
  due: number;
  overdue: number;
  /** When nothing is due: when the next review falls due. */
  nextDue?: string;
  /** The weakest spots, for the list. */
  spots: WeakSpot[];
  counts: { weak: number; mistakes: number; saved: number };
  levels: ReturnType<typeof levelCountsBySkill>;
}

export function subjectPractice(courseId: string, records: PracticeRecords, now = new Date()): SubjectPractice {
  const reviews = records.reviews.filter((review) => review.courseId === courseId);
  const mastery = records.mastery.filter((record) => record.courseId === courseId);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const dueReviews = reviews.filter((review) => isDue(review, now));
  const upcoming = reviews.filter((review) => !isDue(review, now)).sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
  const inSubject = <T extends { courseId: string }>(entries: T[]) => entries.filter((entry) => entry.courseId === courseId);
  return {
    due: dueReviews.length,
    overdue: dueReviews.filter((review) => new Date(review.due) < startOfToday).length,
    nextDue: upcoming[0]?.due,
    spots: weakSpots(mastery),
    counts: {
      weak: weakSpots(mastery, { limit: Infinity }).length,
      mistakes: inSubject(mistakeRefs(records.attempts, Infinity)).length,
      saved: inSubject(savedRefs(records.bookmarks)).length,
    },
    levels: levelCountsBySkill(mastery),
  };
}

/** The subjects with anything to practise, or started: those listed on the Practice page. */
export function practisedCourseIds(records: PracticeRecords, startedCourseIds: Iterable<string>): Set<string> {
  const ids = new Set<string>(startedCourseIds);
  for (const entry of [...records.reviews, ...records.mastery, ...records.attempts, ...records.bookmarks]) if (entry.courseId) ids.add(entry.courseId);
  return ids;
}
