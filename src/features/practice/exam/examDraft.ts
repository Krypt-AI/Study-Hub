/**
 * An unfinished sitting, saved with the learner's data (to the account when signed in) so a
 * reload, a detour or another device does not lose it. The sitting is recorded in the learner's
 * progress only when it is marked; the draft is deleted then.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learnerKeys } from '@/data/queries';
import { examDraftId, type ExamDraftRecord } from '@/data/records';
import { useRepository } from '@/data/useRepository';

/** A draft for an exam whose sections changed since it was saved cannot be resumed. */
export const isResumable = (draft: ExamDraftRecord | undefined, sectionCount: number): draft is ExamDraftRecord => !!draft && draft.sectionIndex < sectionCount;

interface BrowserDraft {
  version: 1;
  sectionIndex: number;
  startedAt: number;
  endsAt?: number;
  timesMs: number[];
  timed: boolean;
  answers: ExamDraftRecord['answers'];
}

/**
 * Before sittings were saved with the learner's data they were kept in this browser's
 * localStorage. Returns such a sitting once, removing it from the browser.
 */
export function takeBrowserDraft(courseId: string, assessmentId: string): ExamDraftRecord | undefined {
  const key = `study-hub:exam-draft:${courseId}/${assessmentId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    localStorage.removeItem(key);
    const draft = JSON.parse(raw) as BrowserDraft;
    if (draft.version !== 1) return undefined;
    const { sectionIndex, startedAt, endsAt, timesMs, timed, answers } = draft;
    return { id: examDraftId(courseId, assessmentId), courseId, assessmentId, sectionIndex, startedAt, endsAt, timesMs, timed, answers, updatedAt: new Date().toISOString() };
  } catch {
    return undefined;
  }
}

/** The learner's unfinished sitting of an exam; a sitting left in this browser by an older version is moved in once. */
export function useExamDraft(courseId: string, assessmentId: string) {
  const repository = useRepository();
  const id = examDraftId(courseId, assessmentId);
  return useQuery({
    queryKey: learnerKeys.examDraft(id),
    queryFn: async () => {
      const saved = await repository.getExamDraft(id);
      if (saved) return saved;
      const fromBrowser = takeBrowserDraft(courseId, assessmentId);
      if (fromBrowser) await repository.saveExamDraft(fromBrowser);
      return fromBrowser ?? null;
    },
    staleTime: Infinity,
  });
}

/**
 * Saves run one after another, so a slower request can never overwrite a newer sitting; the cached
 * draft is updated at once, so leaving the page and coming back resumes the latest state.
 */
export function useSaveExamDraft(id: string) {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    scope: { id: `exam-draft:${id}` },
    mutationFn: (draft: ExamDraftRecord) => repository.saveExamDraft(draft),
    onMutate: (draft) => client.setQueryData(learnerKeys.examDraft(id), draft),
  });
}

export function useDeleteExamDraft(id: string) {
  const repository = useRepository();
  const client = useQueryClient();
  return useMutation({
    scope: { id: `exam-draft:${id}` },
    mutationFn: () => repository.deleteExamDraft(id),
    onMutate: () => client.setQueryData(learnerKeys.examDraft(id), null),
  });
}
