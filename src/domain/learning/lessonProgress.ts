/** Lesson start / resume / completion bookkeeping. */
import type { LessonProgressRecord } from '@/data/records';
import type { StudyRepository } from '@/data/repository';
import { dayKey } from '@/lib/dates';

export interface LessonRef {
  courseId: string;
  lessonId: string;
}

function blankProgress(ref: LessonRef, at: string): LessonProgressRecord {
  return {
    ...ref,
    status: 'in-progress',
    answeredQuestionIds: [],
    correctQuestionIds: [],
    lastBlockIndex: 0,
    startedAt: at,
    updatedAt: at,
  };
}

/** Remember where the learner is in a lesson (creates the progress record on first visit). */
export async function saveLessonPosition(repository: StudyRepository, ref: LessonRef, blockIndex: number, now = new Date()): Promise<void> {
  const at = now.toISOString();
  const progress = (await repository.getLessonProgress(ref.lessonId)) ?? blankProgress(ref, at);
  if (progress.lastBlockIndex === blockIndex && progress.updatedAt !== progress.startedAt) return;
  await repository.saveLessonProgress({ ...progress, lastBlockIndex: blockIndex, updatedAt: at });
}

/** Mark a lesson complete. Counts toward today's activity only the first time. */
export async function completeLesson(repository: StudyRepository, ref: LessonRef, now = new Date()): Promise<LessonProgressRecord> {
  const at = now.toISOString();
  const progress = (await repository.getLessonProgress(ref.lessonId)) ?? blankProgress(ref, at);
  if (progress.status === 'completed') return progress;
  const completed: LessonProgressRecord = { ...progress, status: 'completed', completedAt: at, updatedAt: at };
  await repository.saveLessonProgress(completed);
  await repository.recordActivity(dayKey(now), { lessonsCompleted: 1 });
  return completed;
}

/** Reopen a completed lesson (e.g. to study it again from the start). */
export async function reopenLesson(repository: StudyRepository, ref: LessonRef, now = new Date()): Promise<void> {
  const progress = await repository.getLessonProgress(ref.lessonId);
  if (!progress) return;
  await repository.saveLessonProgress({ ...progress, status: 'in-progress', completedAt: undefined, updatedAt: now.toISOString() });
}
