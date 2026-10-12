/**
 * An unfinished sitting, kept in this browser so a reload or a detour does not lose it.
 * A convenience like a draft: if storage is unavailable the exam still works, it just
 * cannot be resumed. The sitting is saved to your progress only when it is marked.
 */
import type { Response } from '@/domain/evaluation/types';

export interface ExamDraft {
  version: 1;
  sectionIndex: number;
  /** Section clock, in epoch milliseconds: it keeps running while you are away, as in the real test. */
  startedAt: number;
  endsAt?: number;
  /** Time spent in each finished section. */
  timesMs: number[];
  timed: boolean;
  answers: Record<string, Response>;
}

const key = (courseId: string, assessmentId: string) => `study-hub:exam-draft:${courseId}/${assessmentId}`;

export function loadExamDraft(courseId: string, assessmentId: string, sectionCount: number): ExamDraft | undefined {
  try {
    const raw = localStorage.getItem(key(courseId, assessmentId));
    const draft = raw ? (JSON.parse(raw) as ExamDraft) : undefined;
    // A draft from an older format, or for an exam whose sections changed, cannot be resumed.
    return draft?.version === 1 && draft.sectionIndex < sectionCount ? draft : undefined;
  } catch {
    return undefined;
  }
}

export function saveExamDraft(courseId: string, assessmentId: string, draft: ExamDraft): void {
  try {
    localStorage.setItem(key(courseId, assessmentId), JSON.stringify(draft));
  } catch {
    /* storage unavailable */
  }
}

export function clearExamDraft(courseId: string, assessmentId: string): void {
  try {
    localStorage.removeItem(key(courseId, assessmentId));
  } catch {
    /* storage unavailable */
  }
}
