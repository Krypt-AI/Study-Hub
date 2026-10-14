/** The University subjects, with their semesters, as the calendar needs them. */
import { useMemo } from 'react';
import { useCatalog } from '@/domain/content/load';
import type { CourseSummary } from '@/domain/content/types';

export interface Subject {
  courseId: string;
  code?: string;
  title: string;
  term?: string;
}

export const subjectLabel = (subject: Pick<Subject, 'code' | 'title'>) => (subject.code ? `${subject.code} ${subject.title}` : subject.title);

const toSubject = (course: CourseSummary): Subject => ({ courseId: course.id, code: course.code, title: course.title, term: course.term });

export function useSubjects() {
  const catalog = useCatalog();
  return useMemo(() => {
    const subjects = (catalog.data?.courses ?? []).filter((course) => course.category === 'university').map(toSubject);
    return {
      isLoading: catalog.isLoading,
      subjects,
      subjectById: new Map(subjects.map((subject) => [subject.courseId, subject])),
    };
  }, [catalog.data, catalog.isLoading]);
}
