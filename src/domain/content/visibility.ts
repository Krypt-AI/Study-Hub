/**
 * Which courses, certifications and roadmaps a learner sees: one rule, used by every page that lists
 * them. A learner sees their own level (university, or every year of primary or secondary school) and
 * the extras they chose. Guests cannot choose extras. A bilingual school subject shows the course in
 * the language the learner picked for it. Hiding is only about lists: progress is kept, and a course
 * opened by its link still opens.
 */
import type { LearnerProfile } from '@/domain/profile/profile';
import type { Certification, CourseCategory, CourseLanguage, CourseSummary } from './types';

export type ExtraCategory = 'chinese' | 'japanese' | 'ai-engineering' | 'it';

export const EXTRA_CATEGORIES: ExtraCategory[] = ['chinese', 'japanese', 'ai-engineering', 'it'];

export const isExtraCategory = (category: string): category is ExtraCategory => (EXTRA_CATEGORIES as string[]).includes(category);

/** A bilingual school subject opens in BM until the learner picks English for it. */
export const DEFAULT_COURSE_LANGUAGE: CourseLanguage = 'ms';

export interface Visibility {
  profile: LearnerProfile | undefined;
  /** Signed in, or local mode (which has no sign-in). Guests see their level only. */
  extrasAllowed: boolean;
  visibleCategories: readonly ExtraCategory[];
  /** Keyed by the course's `subject`. */
  languageBySubject: Readonly<Record<string, CourseLanguage>>;
}

type Listed = Pick<CourseSummary, 'id' | 'category' | 'subject' | 'year' | 'language'>;

export function isCategoryVisible(category: CourseCategory, visibility: Visibility): boolean {
  if (isExtraCategory(category)) return visibility.extrasAllowed && visibility.visibleCategories.includes(category);
  // Before the Welcome page is answered no level is known; the app shows the Welcome page then anyway.
  return !visibility.profile || category === visibility.profile.level;
}

/** The courses to list, in their given order. */
export function visibleCourses<T extends Listed>(courses: readonly T[], visibility: Visibility): T[] {
  const shown = courses.filter((course) => isCategoryVisible(course.category, visibility));
  return shown.filter((course) => !hasOtherLanguageChosen(course, shown, visibility));
}

const sameSubject = (a: Listed, b: Listed) => a.category === b.category && a.year === b.year && a.subject === b.subject;

/** True for one language of a subject taught in both, when the learner's language for it is the other. */
function hasOtherLanguageChosen(course: Listed, shown: readonly Listed[], visibility: Visibility): boolean {
  if (!course.subject || !course.language) return false;
  const chosen = visibility.languageBySubject[course.subject] ?? DEFAULT_COURSE_LANGUAGE;
  if (course.language === chosen) return false;
  return shown.some((other) => other.id !== course.id && sameSubject(other, course) && other.language === chosen);
}

/** The same subject and year in the other language, if Study Hub has it. */
export function otherLanguageCourse<T extends Listed>(course: Listed, courses: readonly T[]): T | undefined {
  if (!course.subject || !course.language) return undefined;
  return courses.find((other) => other.id !== course.id && sameSubject(other, course) && other.language && other.language !== course.language);
}

/** The extras of the given courses (those with progress or saved questions), to tick before the learner chooses. */
export function extrasOf(courseIds: Iterable<string>, courses: readonly Pick<CourseSummary, 'id' | 'category'>[]): ExtraCategory[] {
  const ids = new Set(courseIds);
  const used = new Set(courses.filter((course) => ids.has(course.id)).map((course) => course.category));
  return EXTRA_CATEGORIES.filter((category) => used.has(category));
}

/** The extra a certification belongs to: language tests to their language, AI and data to AI engineering, the rest to IT. */
export function certificationExtra(category: Certification['category']): ExtraCategory {
  if (category === 'japanese' || category === 'chinese') return category;
  if (category === 'ai-ml' || category === 'data') return 'ai-engineering';
  return 'it';
}

export const visibleCertifications = <T extends Pick<Certification, 'category'>>(certifications: readonly T[], visibility: Visibility): T[] =>
  certifications.filter((certification) => isCategoryVisible(certificationExtra(certification.category), visibility));

/** Certifications are listed once any extra is chosen; the AI engineering roadmap with that extra. */
export const showsCertifications = (visibility: Visibility) => visibility.extrasAllowed && visibility.visibleCategories.length > 0;
export const showsRoadmaps = (visibility: Visibility) => isCategoryVisible('ai-engineering', visibility);

/**
 * School courses with the learner's year first, then the other years in order; other courses keep
 * their order.
 */
export function learnerYearFirst<T extends Pick<CourseSummary, 'year'>>(courses: readonly T[], profile: LearnerProfile | undefined): T[] {
  const rank = (course: T) => (course.year === undefined ? 0 : course.year === profile?.year ? 0 : course.year);
  return [...courses].sort((a, b) => rank(a) - rank(b));
}
