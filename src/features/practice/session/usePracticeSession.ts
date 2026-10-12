/**
 * Drives a sequence of questions: drafts, hints, attempts, reveals and feedback per item,
 * and records every judged answer. Retries are free practice: only the first attempt in a
 * session moves the review schedule (see recordAnswer).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import type { BubbleState } from '@/components/ui/Bubble';
import type { PracticeMode } from '@/data/records';
import { useRecordAnswer } from '@/data/queries';
import type { Question } from '@/domain/content/types';
import { confirmSelfReview, isSyncQuestion } from '@/domain/evaluation/evaluate';
import type { Feedback, Response, Verdict } from '@/domain/evaluation/types';
import type { RunResponse } from '@/workers/protocol';
import { judgeResponse } from './judge';
import { emptyResponse } from './responses';

export interface SessionItem {
  question: Question;
  courseId?: string;
  lessonId?: string;
  assessmentId?: string;
  topics: string[];
  /** Result from an earlier session, shown on the answer strip until answered again. */
  previous?: 'correct' | 'wrong';
}

export interface ItemState {
  draft: Response;
  feedback?: Feedback;
  run?: RunResponse;
  attempts: number;
  hintsUsed: number;
  revealed: boolean;
  shownAt: number;
  running: boolean;
  runStatus?: string;
  /** Self-review feedback waiting for the learner to confirm a mark. */
  pendingSelfReview: boolean;
  lastVerdict?: Verdict;
  error?: string;
}

const freshState = (question: Question): ItemState => ({
  draft: emptyResponse(question),
  attempts: 0,
  hintsUsed: 0,
  revealed: false,
  shownAt: Date.now(),
  running: false,
  pendingSelfReview: false,
});

export function verdictBubble(verdict: Verdict | undefined): BubbleState {
  switch (verdict) {
    case 'correct':
      return 'correct';
    case 'almost':
      return 'almost';
    case 'partial':
    case 'incorrect':
      return 'wrong';
    default:
      return 'filled';
  }
}

export interface PracticeSession {
  items: SessionItem[];
  index: number;
  item: SessionItem | undefined;
  state: ItemState | undefined;
  stripStates: BubbleState[];
  /** Index whose bubble just changed, to animate the fill. */
  justMarked?: number;
  summary: { answered: number; correct: number; almost: number; wrong: number };
  setDraft: (draft: Response) => void;
  submit: () => Promise<void>;
  takeHint: () => void;
  reveal: () => void;
  confirmSelfReview: (score: number) => void;
  retry: () => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
}

export function usePracticeSession(items: SessionItem[], mode: PracticeMode, initialIndex = 0): PracticeSession {
  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)));
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [justMarked, setJustMarked] = useState<number>();
  const record = useRecordAnswer();
  const recordRef = useRef(record.mutateAsync);
  recordRef.current = record.mutateAsync;

  const item = items[index];
  const state = item ? (states[item.question.id] ?? freshState(item.question)) : undefined;

  const update = useCallback((questionId: string, question: Question, change: (current: ItemState) => ItemState) => {
    setStates((current) => ({ ...current, [questionId]: change(current[questionId] ?? freshState(question)) }));
  }, []);

  const persist = useCallback(
    async (target: SessionItem, itemState: ItemState, feedback: Feedback, extra: { revealed?: boolean; selfAssessed?: boolean } = {}) => {
      await recordRef.current({
        question: target.question,
        topics: target.topics,
        courseId: target.courseId,
        lessonId: target.lessonId,
        assessmentId: target.assessmentId,
        mode,
        response: itemState.draft,
        feedback,
        hintsUsed: itemState.hintsUsed,
        revealed: extra.revealed ?? itemState.revealed,
        selfAssessed: extra.selfAssessed ?? false,
        firstAttemptInSession: itemState.attempts === 0,
        durationMs: Date.now() - itemState.shownAt,
      });
    },
    [mode],
  );

  const markIndex = (position: number) => {
    setJustMarked(position);
    window.setTimeout(() => setJustMarked((current) => (current === position ? undefined : current)), 600);
  };

  const submit = useCallback(async () => {
    if (!item || !state || state.running) return;
    const { question } = item;
    let feedback: Feedback;
    let run: RunResponse | undefined;

    if (!isSyncQuestion(question)) update(question.id, question, (current) => ({ ...current, running: true, runStatus: undefined, error: undefined }));
    try {
      ({ feedback, run } = await judgeResponse(question, state.draft, (message) =>
        update(question.id, question, (current) => ({ ...current, runStatus: message })),
      ));
    } catch (error) {
      update(question.id, question, (current) => ({ ...current, running: false, error: error instanceof Error ? error.message : String(error) }));
      return;
    }

    const pendingSelfReview = feedback.verdict === 'self-review';
    update(question.id, question, (current) => ({
      ...current,
      feedback,
      run,
      running: false,
      runStatus: undefined,
      pendingSelfReview,
      lastVerdict: pendingSelfReview ? current.lastVerdict : feedback.verdict,
      attempts: pendingSelfReview ? current.attempts : current.attempts + 1,
    }));
    if (!pendingSelfReview) {
      markIndex(index);
      await persist(item, state, feedback);
    }
  }, [item, state, index, persist, update]);

  const confirmSelf = useCallback(
    (score: number) => {
      if (!item || !state?.feedback) return;
      const final = confirmSelfReview(state.feedback, score);
      update(item.question.id, item.question, (current) => ({
        ...current,
        feedback: final,
        pendingSelfReview: false,
        lastVerdict: final.verdict,
        attempts: current.attempts + 1,
      }));
      markIndex(index);
      void persist(item, state, final, { selfAssessed: true });
    },
    [item, state, index, persist, update],
  );

  const reveal = useCallback(() => {
    if (!item || !state) return;
    const alreadyAnswered = state.attempts > 0;
    const feedback: Feedback = state.feedback && alreadyAnswered
      ? state.feedback
      : {
          verdict: 'incorrect',
          score: 0,
          headline: 'Answer shown',
          points: [{ tone: 'info', message: 'You chose to see the answer; this question comes back for review soon.' }],
          missing: [],
          expected: expectedAnswers(item.question),
        };
    update(item.question.id, item.question, (current) => ({
      ...current,
      revealed: true,
      feedback,
      pendingSelfReview: false,
      lastVerdict: alreadyAnswered ? current.lastVerdict : 'incorrect',
      attempts: current.attempts + (alreadyAnswered ? 0 : 1),
    }));
    if (!alreadyAnswered) {
      markIndex(index);
      void persist(item, state, feedback, { revealed: true });
    }
  }, [item, state, index, persist, update]);

  const stripStates = useMemo(
    () =>
      items.map((entry, position): BubbleState => {
        const itemState = states[entry.question.id];
        if (itemState?.lastVerdict) return verdictBubble(itemState.lastVerdict);
        if (position === index) return 'current';
        if (entry.previous === 'correct') return 'correct';
        if (entry.previous === 'wrong') return 'wrong';
        return 'empty';
      }),
    [items, states, index],
  );

  const summary = useMemo(() => {
    const verdicts = Object.values(states).map((itemState) => itemState.lastVerdict).filter((verdict): verdict is Verdict => Boolean(verdict));
    return {
      answered: verdicts.length,
      correct: verdicts.filter((verdict) => verdict === 'correct').length,
      almost: verdicts.filter((verdict) => verdict === 'almost').length,
      wrong: verdicts.filter((verdict) => verdict === 'incorrect' || verdict === 'partial').length,
    };
  }, [states]);

  return {
    items,
    index,
    item,
    state,
    stripStates,
    justMarked,
    summary,
    setDraft: (draft) => item && update(item.question.id, item.question, (current) => ({ ...current, draft })),
    submit,
    takeHint: () =>
      item &&
      update(item.question.id, item.question, (current) => ({ ...current, hintsUsed: Math.min(current.hintsUsed + 1, item.question.hints.length) })),
    reveal,
    confirmSelfReview: confirmSelf,
    retry: () =>
      item &&
      update(item.question.id, item.question, (current) => ({ ...current, feedback: undefined, run: undefined, pendingSelfReview: false, shownAt: Date.now() })),
    goTo: (position) => setIndex(Math.max(0, Math.min(items.length - 1, position))),
    next: () => setIndex((position) => Math.min(items.length - 1, position + 1)),
    previous: () => setIndex((position) => Math.max(0, position - 1)),
  };
}

export function expectedAnswers(question: Question): string[] {
  switch (question.type) {
    case 'choice':
      return question.correct.map((id) => question.options.find((option) => option.id === id)?.text ?? id);
    case 'short':
    case 'translation':
      return question.accepted;
    case 'cloze':
      return question.blanks.map((blank) => blank.accepted[0] ?? '');
    case 'long':
      return [question.modelAnswer];
    case 'code':
      return question.solution ? [question.solution] : [];
    case 'sql':
      return [question.solution];
  }
}
