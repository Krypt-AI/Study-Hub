/**
 * React Query hooks over the StudyRepository. Reads are cached per record type; every
 * mutation invalidates exactly the caches its write can affect.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AnswerContext, correctLatestAnswer, recordAnswer, type RecordedAnswer } from '@/domain/learning/recordAnswer';
import type { ActivityDelta, Settings } from './records';
import type { AttemptQuery } from './repository';
import { useRepository } from './useRepository';

export const learnerKeys = {
  all: ['learner'] as const,
  settings: ['learner', 'settings'] as const,
  lessonProgress: ['learner', 'lessonProgress'] as const,
  reviewStates: ['learner', 'reviewStates'] as const,
  mastery: ['learner', 'mastery'] as const,
  activity: ['learner', 'activity'] as const,
  attempts: ['learner', 'attempts'] as const,
  semesters: ['learner', 'semesters'] as const,
  timetable: ['learner', 'timetable'] as const,
  importantDates: ['learner', 'important-dates'] as const,
  legacyNotes: ['learner', 'legacy-notes'] as const,
  bookmarks: ['learner', 'bookmarks'] as const,
  certifications: ['learner', 'certifications'] as const,
  projects: ['learner', 'projects'] as const,
  versions: ['learner', 'versions'] as const,
  exercises: ['learner', 'exercises'] as const,
  submissions: ['learner', 'submissions'] as const,
  examDraft: (id: string) => ['learner', 'exam-draft', id] as const,
};

export function useSettings() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.settings, queryFn: () => repository.getSettings() });
}

export function useSaveSettings() {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: Settings) => repository.saveSettings(settings),
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.settings }),
  });
}

export function useLessonProgress(courseId?: string) {
  const repository = useRepository();
  return useQuery({ queryKey: [...learnerKeys.lessonProgress, courseId ?? 'all'], queryFn: () => repository.listLessonProgress(courseId) });
}

export function useReviewStates() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.reviewStates, queryFn: () => repository.listReviewStates() });
}

export function useTopicMastery() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.mastery, queryFn: () => repository.listTopicMastery() });
}

export function useActivityDays(sinceDay?: string) {
  const repository = useRepository();
  return useQuery({ queryKey: [...learnerKeys.activity, sinceDay ?? 'all'], queryFn: () => repository.listActivityDays(sinceDay) });
}

export function useAttempts(query: AttemptQuery = {}) {
  const repository = useRepository();
  return useQuery({ queryKey: [...learnerKeys.attempts, query], queryFn: () => repository.listAttempts(query) });
}

/** Caches an answer write can change. */
const ANSWER_KEYS = [learnerKeys.attempts, learnerKeys.reviewStates, learnerKeys.mastery, learnerKeys.activity, learnerKeys.lessonProgress];

/** Records an answer and refreshes everything that depends on it. */
export function useRecordAnswer() {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (context: AnswerContext) => recordAnswer(repository, context),
    onSuccess: () => Promise.all(ANSWER_KEYS.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

/** Re-marks the most recent answer (see correctLatestAnswer) and refreshes the same caches. */
export function useCorrectLatestAnswer() {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ recorded, context }: { recorded: RecordedAnswer; context: AnswerContext }) => correctLatestAnswer(repository, recorded, context),
    onSuccess: () => Promise.all(ANSWER_KEYS.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

/** A batch that stopped part-way: `remaining` are the answers not recorded yet, for a retry. */
export class PartialRecordError extends Error {
  constructor(
    readonly remaining: AnswerContext[],
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = 'PartialRecordError';
  }
}

/** Records several answers in order (e.g. a marked exam) and refreshes once at the end. */
export function useRecordAnswers() {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (contexts: AnswerContext[]) => {
      for (const [index, context] of contexts.entries()) {
        try {
          await recordAnswer(repository, context);
        } catch (error) {
          throw new PartialRecordError(contexts.slice(index), error);
        }
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: learnerKeys.all }),
  });
}

export function useRecordActivity() {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ day, delta }: { day: string; delta: ActivityDelta }) => repository.recordActivity(day, delta),
    onSuccess: () => client.invalidateQueries({ queryKey: learnerKeys.activity }),
  });
}

export function useSemesters() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.semesters, queryFn: () => repository.listSemesters() });
}

export function useTimetableClasses() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.timetable, queryFn: () => repository.listTimetableClasses() });
}

export function useImportantDates() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.importantDates, queryFn: () => repository.listImportantDates() });
}

export function useLegacyNotes() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.legacyNotes, queryFn: () => repository.listLegacyNotes() });
}

export function useBookmarks() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.bookmarks, queryFn: () => repository.listBookmarks() });
}

export function useCertificationProgress() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.certifications, queryFn: () => repository.listCertificationProgress() });
}

export function useCodeProjects() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.projects, queryFn: () => repository.listCodeProjects() });
}

export function useCodeVersions(projectId: string | undefined) {
  const repository = useRepository();
  return useQuery({
    queryKey: [...learnerKeys.versions, projectId ?? ''],
    queryFn: () => repository.listCodeVersions(projectId ?? ''),
    enabled: Boolean(projectId),
  });
}

export function useCustomExercises() {
  const repository = useRepository();
  return useQuery({ queryKey: learnerKeys.exercises, queryFn: () => repository.listCustomExercises() });
}

export function useSubmissions(exerciseId?: string) {
  const repository = useRepository();
  return useQuery({ queryKey: [...learnerKeys.submissions, exerciseId ?? 'all'], queryFn: () => repository.listSubmissions(exerciseId) });
}
