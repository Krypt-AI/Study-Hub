/**
 * Starting a chapter again: its lessons lose their progress (answer strips, completion) and their
 * questions leave the review schedule. The answer history and topic mastery stay, so past work
 * still counts in the learner's statistics.
 */
import type { StudyRepository } from '@/data/repository';

export interface LessonToReset {
  lessonId: string;
  questionIds: string[];
}

export async function resetLessons(repository: Pick<StudyRepository, 'deleteLessonProgress' | 'deleteReviewStates'>, lessons: LessonToReset[]): Promise<void> {
  for (const lesson of lessons) await repository.deleteLessonProgress(lesson.lessonId);
  await repository.deleteReviewStates(lessons.flatMap((lesson) => lesson.questionIds));
}
