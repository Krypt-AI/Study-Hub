/**
 * A subject's study plan: what Study Hub does with the learner's work in it. Each level adds to the one
 * before, and only subjects with a plan above "material" bring work to Today, so other subjects never
 * add pressure. A subject without a plan is "material": the learner just uses it.
 *
 *  - material: read the lessons, answer questions, sit papers. Nothing is scheduled or tracked.
 *  - practice: also tracks topic mastery, so weak topics show on Today and in Practice.
 *  - review:   also schedules spaced reviews of every question answered, due on Today.
 */

export const STUDY_PLAN_LEVELS = ['material', 'practice', 'review'] as const;
export type StudyPlanLevel = (typeof STUDY_PLAN_LEVELS)[number];

/** The learner's plans, by course id; a course not listed is "material". */
export type StudyPlans = Record<string, StudyPlanLevel>;

export const STUDY_PLAN_INFO: Record<StudyPlanLevel, { title: string; adds: string[] }> = {
  material: { title: 'Use the material', adds: ['Read lessons, answer questions and sit past papers'] },
  practice: { title: 'Practise weak topics', adds: ['Track how well you know each topic', 'Show weak topics on Today and in Practice'] },
  review: { title: 'Practise and review', adds: ['Bring each answered question back for review when it is due'] },
};

/** Everything a level includes, its own additions last. */
export const studyPlanIncludes = (level: StudyPlanLevel): string[] =>
  STUDY_PLAN_LEVELS.slice(0, STUDY_PLAN_LEVELS.indexOf(level) + 1).flatMap((included) => STUDY_PLAN_INFO[included].adds);

/** A course's level; work outside any course is never tracked. */
export const planOf = (plans: StudyPlans, courseId: string | undefined): StudyPlanLevel => (courseId ? (plans[courseId] ?? 'material') : 'material');

/** Whether answers in this course update topic mastery (weak topics). */
export const tracksMastery = (plans: StudyPlans, courseId: string | undefined) => planOf(plans, courseId) !== 'material';

/** Whether answers in this course are scheduled for spaced review. */
export const schedulesReviews = (plans: StudyPlans, courseId: string | undefined) => planOf(plans, courseId) === 'review';

/** Weak-topic records of the subjects that track mastery. */
export const withMasteryTracked = <T extends { courseId?: string }>(records: T[], plans: StudyPlans): T[] => records.filter((record) => tracksMastery(plans, record.courseId));

/** Review records of the subjects that schedule reviews. */
export const withReviewsScheduled = <T extends { courseId?: string }>(records: T[], plans: StudyPlans): T[] => records.filter((record) => schedulesReviews(plans, record.courseId));

/** The subjects with a plan above "material", in the order they were given one. */
export const plannedCourseIds = (plans: StudyPlans): string[] => Object.keys(plans).filter((courseId) => plans[courseId] !== 'material');

/** Sets a course's level; "material" is the default, so it is not stored. */
export function setStudyPlan(plans: StudyPlans, courseId: string, level: StudyPlanLevel): StudyPlans {
  const { [courseId]: _previous, ...others } = plans;
  return level === 'material' ? others : { ...others, [courseId]: level };
}
