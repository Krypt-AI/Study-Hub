/**
 * The Today screen's view model, computed from learner records and the catalog.
 * Pure so it can be tested without a browser.
 */
import type { ActivityDayRecord, LessonProgressRecord, ReviewStateRecord, Settings, TopicMasteryRecord } from '@/data/records';
import type { Catalog, CourseSummary, Skill } from '@/domain/content/types';
import { computeStreak, dailyGoalProgress, type GoalProgress, type StreakSummary } from '@/domain/learning/activity';
import { masteryLevel, type MasteryLevel, needsPractice } from '@/domain/learning/mastery';
import { dueCountsByCourse } from '@/domain/learning/due';
import { addDays, dayKey } from '@/lib/dates';

export interface ResumeTarget {
  course: CourseSummary;
  lessonId: string;
  lessonTitle: string;
  answered: number;
  correct: number;
  /** Lesson question count is only known once the course is loaded. */
  progress?: LessonProgressRecord;
}

export interface DueCourse {
  course: CourseSummary | undefined;
  courseId: string;
  due: number;
  overdue: number;
}

export interface WeakTopic {
  topicId: string;
  title: string;
  /** The topic's weakest skill. */
  skill: Skill;
  course: CourseSummary | undefined;
  level: MasteryLevel;
  score: number;
  attempts: number;
}

export interface WeekDay {
  day: string;
  minutes: number;
  attempts: number;
  isToday: boolean;
}

export interface TodayModel {
  goal: GoalProgress;
  streak: StreakSummary;
  resume?: ResumeTarget;
  dueByCourse: DueCourse[];
  dueTotal: number;
  weakTopics: WeakTopic[];
  week: WeekDay[];
  isNewLearner: boolean;
}

export interface TodayInputs {
  catalog: Catalog;
  settings: Settings;
  progress: LessonProgressRecord[];
  reviews: ReviewStateRecord[];
  mastery: TopicMasteryRecord[];
  activity: ActivityDayRecord[];
  now?: Date;
}

export function computeTodayModel({ catalog, settings, progress, reviews, mastery, activity, now = new Date() }: TodayInputs): TodayModel {
  const today = dayKey(now);
  const courseById = new Map(catalog.courses.map((course) => [course.id, course]));

  const latest = [...progress].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const resumeProgress = latest.find((record) => record.status === 'in-progress') ?? latest[0];
  let resume: ResumeTarget | undefined;
  if (resumeProgress) {
    const course = courseById.get(resumeProgress.courseId);
    const lesson = course?.lessons.find((candidate) => candidate.id === resumeProgress.lessonId);
    if (course && lesson) {
      // A completed lesson resumes at the next one in the course.
      const nextLesson =
        resumeProgress.status === 'completed' ? course.lessons[course.lessons.findIndex((candidate) => candidate.id === lesson.id) + 1] : undefined;
      const target = nextLesson ?? lesson;
      resume = {
        course,
        lessonId: target.id,
        lessonTitle: target.title,
        answered: target === lesson ? resumeProgress.answeredQuestionIds.length : 0,
        correct: target === lesson ? resumeProgress.correctQuestionIds.length : 0,
        progress: target === lesson ? resumeProgress : undefined,
      };
    }
  }

  const dueByCourse: DueCourse[] = dueCountsByCourse(reviews, now).map((entry) => ({ ...entry, course: courseById.get(entry.courseId) }));

  // One row per topic, showing its weakest skill.
  const weakestByTopic = new Map<string, TopicMasteryRecord>();
  for (const record of mastery.filter(needsPractice)) {
    const current = weakestByTopic.get(record.topicId);
    if (!current || record.ema < current.ema) weakestByTopic.set(record.topicId, record);
  }
  const weakTopics = [...weakestByTopic.values()]
    .sort((a, b) => a.ema - b.ema)
    .slice(0, 4)
    .map((record): WeakTopic => {
      const course = record.courseId ? courseById.get(record.courseId) : undefined;
      return {
        topicId: record.topicId,
        title: course?.topics.find((topic) => topic.id === record.topicId)?.title ?? record.topicId,
        skill: record.skill,
        course,
        level: masteryLevel(record),
        score: record.ema,
        attempts: record.attempts,
      };
    });

  const byDay = new Map(activity.map((record) => [record.day, record]));
  const week: WeekDay[] = Array.from({ length: 7 }, (_, offset) => {
    const day = addDays(today, offset - 6);
    const record = byDay.get(day);
    return { day, minutes: record?.minutes ?? 0, attempts: record?.attempts ?? 0, isToday: day === today };
  });

  return {
    goal: dailyGoalProgress(byDay.get(today), settings),
    streak: computeStreak(activity, today),
    resume,
    dueByCourse,
    dueTotal: dueByCourse.reduce((sum, entry) => sum + entry.due, 0),
    weakTopics,
    week,
    isNewLearner: progress.length === 0 && reviews.length === 0,
  };
}
