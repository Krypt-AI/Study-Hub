/** The University catalog as the calendar needs it: the semesters and each one's subjects. */
import { useMemo } from 'react';
import { useCatalog } from '@/domain/content/load';
import type { CourseSummary } from '@/domain/content/types';

export interface Subject {
  courseId: string;
  code?: string;
  title: string;
  term?: string;
}

/** Used when the catalog has no University area: the calendar still works for one semester. */
const FALLBACK_TERM = 'This semester';

export const subjectLabel = (subject: Pick<Subject, 'code' | 'title'>) => (subject.code ? `${subject.code} ${subject.title}` : subject.title);

const toSubject = (course: CourseSummary): Subject => ({ courseId: course.id, code: course.code, title: course.title, term: course.term });

export function useSubjects() {
  const catalog = useCatalog();
  return useMemo(() => {
    const university = catalog.data?.university;
    const subjects = (catalog.data?.courses ?? []).filter((course) => course.category === 'university').map(toSubject);
    return {
      isLoading: catalog.isLoading,
      terms: university?.terms.length ? university.terms : [FALLBACK_TERM],
      currentTerm: university?.currentTerm ?? FALLBACK_TERM,
      subjects,
      subjectById: new Map(subjects.map((subject) => [subject.courseId, subject])),
    };
  }, [catalog.data, catalog.isLoading]);
}
