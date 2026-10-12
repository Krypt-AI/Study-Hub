/** Read-only helpers for walking a course: lessons in order, question lookup, topics. */
import type { Assessment, Course, Lesson, Question } from './types';

export interface LessonLocation {
  lesson: Lesson;
  unitId: string;
  unitTitle: string;
  index: number;
}

export function lessonsInOrder(course: Course): LessonLocation[] {
  let index = 0;
  return course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ lesson, unitId: unit.id, unitTitle: unit.title, index: index++ })));
}

export function findLesson(course: Course, lessonId: string): LessonLocation | undefined {
  return lessonsInOrder(course).find((location) => location.lesson.id === lessonId);
}

export function adjacentLessons(course: Course, lessonId: string): { previous?: Lesson; next?: Lesson } {
  const lessons = lessonsInOrder(course);
  const index = lessons.findIndex((location) => location.lesson.id === lessonId);
  return { previous: lessons[index - 1]?.lesson, next: lessons[index + 1]?.lesson };
}

export function findAssessment(course: Course, assessmentId: string): Assessment | undefined {
  return course.assessments.find((assessment) => assessment.id === assessmentId);
}

export interface QuestionLocation {
  question: Question;
  courseId: string;
  lessonId?: string;
  assessmentId?: string;
  /** Topics credited when the question is answered: its own, else its lesson's. */
  topics: string[];
}

/** Every question of a course indexed by id (lessons and assessments). */
export function indexQuestions(course: Course): Map<string, QuestionLocation> {
  const index = new Map<string, QuestionLocation>();
  for (const { lesson } of lessonsInOrder(course)) {
    for (const question of lesson.questions) {
      index.set(question.id, { question, courseId: course.id, lessonId: lesson.id, topics: question.topics.length ? question.topics : lesson.topics });
    }
  }
  for (const assessment of course.assessments) {
    for (const section of assessment.sections) {
      for (const question of section.questions) {
        index.set(question.id, { question, courseId: course.id, assessmentId: assessment.id, topics: question.topics });
      }
    }
  }
  return index;
}

export function topicTitle(course: Course, topicId: string): string {
  return course.topics.find((topic) => topic.id === topicId)?.title ?? topicId;
}
