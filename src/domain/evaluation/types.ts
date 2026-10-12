import type { Question } from '@/domain/content/types';

/**
 * correct     the answer matches
 * almost      right, apart from a small slip (a typo, a missing or wrong tone, romaji instead of kana)
 * partial     some parts right (cloze blanks, multi-select, some tests passing)
 * incorrect   the answer does not match
 * self-review the answer cannot be judged reliably by rules (open answers, free translations):
 *             the learner compares it with the model answer and rubric and confirms a result
 */
export type Verdict = 'correct' | 'almost' | 'partial' | 'incorrect' | 'self-review';

export interface FeedbackPoint {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
}

export interface FeedbackPart {
  label: string;
  verdict: Verdict;
  response?: string;
  expected?: string;
  message?: string;
}

export interface RubricCheck {
  id: string;
  label: string;
  weight: number;
  detected: boolean;
}

export interface Feedback {
  verdict: Verdict;
  /** 0..1. For self-review this is the automatic estimate until the learner confirms. */
  score: number;
  headline: string;
  points: FeedbackPoint[];
  /** Concepts or criteria the answer seems to be missing. */
  missing: string[];
  /** Accepted or model answers to reveal after the attempt. */
  expected: string[];
  /** How the answer was judged, when the judgement is approximate. */
  limitations?: string;
  parts?: FeedbackPart[];
  rubric?: RubricCheck[];
}

export type Response =
  | { type: 'choice'; selected: string[] }
  | { type: 'short'; text: string }
  | { type: 'cloze'; blanks: Record<string, string> }
  | { type: 'long'; text: string }
  | { type: 'translation'; text: string }
  | { type: 'code'; code: string }
  | { type: 'sql'; code: string };

export type ResponseFor<Q extends Question> = Extract<Response, { type: Q['type'] }>;

/** Score credited for an "almost" answer: counts as known, but is reviewed sooner. */
export const ALMOST_SCORE = 0.85;

export function verdictFromScore(score: number): Verdict {
  if (score >= 0.999) return 'correct';
  if (score >= ALMOST_SCORE) return 'almost';
  if (score > 0) return 'partial';
  return 'incorrect';
}

export function isPassing(verdict: Verdict): boolean {
  return verdict === 'correct' || verdict === 'almost';
}
