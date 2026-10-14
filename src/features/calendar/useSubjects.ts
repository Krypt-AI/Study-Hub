/**
 * The courses a class or date can be linked to: any course (a Japanese class can link to a JLPT
 * course), University subjects with the semester they belong to.
 */
import { useMemo } from 'react';
import { useCatalog } from '@/domain/content/load';
import type { CourseCategory, CourseSummary } from '@/domain/content/types';

export interface Subject {
  courseId: string;
  category: CourseCategory;
  code?: string;
  title: string;
  term?: string;
}

export const subjectLabel = (subject: Pick<Subject, 'code' | 'title'>) => (subject.code ? `${subject.code} ${subject.title}` : subject.title);

/** The short name a date's default title starts with: the subject code, else its title. */
export const subjectShortName = (subject: Pick<Subject, 'code' | 'title'>) => subject.code ?? subject.title;

/** University subjects of `term` and every course outside the University area. */
export const subjectsFor = (subjects: Subject[], term: string) => subjects.filter((subject) => subject.category !== 'university' || !subject.term || subject.term === term);

const toSubject = (course: CourseSummary): Subject => ({ courseId: course.id, category: course.category, code: course.code, title: course.title, term: course.term });

export function useSubjects() {
  const catalog = useCatalog();
  return useMemo(() => {
    const subjects = (catalog.data?.courses ?? []).map(toSubject);
    return {
      isLoading: catalog.isLoading,
      subjects,
      subjectById: new Map(subjects.map((subject) => [subject.courseId, subject])),
    };
  }, [catalog.data, catalog.isLoading]);
}
