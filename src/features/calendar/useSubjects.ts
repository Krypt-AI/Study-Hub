/**
 * The courses a class or date can be linked to: any course (a Japanese class can link to a JLPT
 * course), University subjects with the semester they belong to.
 */
import { useMemo } from 'react';
import { useCatalog } from '@/domain/content/load';
import type { CourseCategory, CourseSummary } from '@/domain/content/types';
import { useVisibleCatalog } from '@/features/profile/useVisibility';

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

/** `subjects` to choose from are the courses the learner sees; `subjectById` still names a class linked to one now hidden. */
export function useSubjects() {
  const catalog = useCatalog();
  const visible = useVisibleCatalog();
  return useMemo(() => {
    const all = (catalog.data?.courses ?? []).map(toSubject);
    return {
      isLoading: !visible.data,
      subjects: (visible.data?.courses ?? []).map(toSubject),
      subjectById: new Map(all.map((subject) => [subject.courseId, subject])),
    };
  }, [catalog.data, visible.data]);
}
