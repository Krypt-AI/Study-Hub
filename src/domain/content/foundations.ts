/**
 * Foundation courses: a course that certifications and roadmap stages build on (Linux Fundamentals for
 * most IT exams), with how much each relies on it and which of its units (modules) matter.
 */
import type { Certification, CertificationFoundation, CourseSummary, FoundationRelevance, StageFoundation } from './types';

export const RELEVANCE_ORDER: FoundationRelevance[] = ['essential', 'strongly-recommended', 'optional'];

export interface FoundationModule {
  id: string;
  title: string;
  lessons: CourseSummary['lessons'];
}

/** The units a foundation names, in its order, with their lessons; every unit of the course when it names none. */
export function foundationModules(course: Pick<CourseSummary, 'units' | 'lessons'>, foundation: Pick<StageFoundation, 'unitIds'>): FoundationModule[] {
  const units = foundation.unitIds.length > 0 ? foundation.unitIds.flatMap((id) => course.units.filter((unit) => unit.id === id)) : course.units;
  return units.map((unit) => ({ ...unit, lessons: course.lessons.filter((lesson) => lesson.unitId === unit.id) }));
}

export interface FoundationUse {
  certification: Certification;
  foundation: CertificationFoundation;
}

/** The certifications that build on a course, most reliant first, then in catalogue order. */
export function certificationsBuiltOn(certifications: readonly Certification[], courseId: string): FoundationUse[] {
  return certifications
    .flatMap((certification) => certification.foundations.filter((foundation) => foundation.courseId === courseId).map((foundation) => ({ certification, foundation })))
    .sort((a, b) => RELEVANCE_ORDER.indexOf(a.foundation.relevance) - RELEVANCE_ORDER.indexOf(b.foundation.relevance));
}
