/** The practice sessions offered outside lessons, routed as /practice/:mode. */
import type { PracticeMode } from '@/data/records';

export type PracticeModeId = 'review' | 'weak' | 'mistakes' | 'saved' | 'quiz';

export interface PracticeModeInfo {
  title: string;
  description: string;
  /** How answers given in this session are recorded. */
  recordAs: PracticeMode;
}

export const PRACTICE_MODES: Record<PracticeModeId, PracticeModeInfo> = {
  review: {
    title: 'Due reviews',
    description: 'Questions your review schedule brings back just before you are likely to forget them.',
    recordAs: 'review',
  },
  weak: {
    title: 'Practise my weaknesses',
    description: 'Questions from the topics and skills where your recent answers are weakest.',
    recordAs: 'weakness',
  },
  mistakes: {
    title: 'Recent mistakes',
    description: 'Questions whose last answer was wrong or revealed, newest first.',
    recordAs: 'review',
  },
  saved: {
    title: 'Saved questions',
    description: 'Questions you saved for revision with the bookmark button.',
    recordAs: 'review',
  },
  quiz: {
    title: 'Mixed quiz',
    description: 'A random set of questions from one course.',
    recordAs: 'quiz',
  },
};

/** Recent answer history used for mistakes and weak-spot ordering (newest first). */
export const RECENT_ATTEMPTS = { limit: 2000 } as const;

export const isPracticeModeId = (value: string | undefined): value is PracticeModeId => value !== undefined && Object.hasOwn(PRACTICE_MODES, value);

export const practiceUrl = (mode: PracticeModeId, params: Record<string, string | number | undefined> = {}) => {
  const query = new URLSearchParams(Object.entries(params).flatMap(([key, value]) => (value === undefined ? [] : [[key, String(value)]]))).toString();
  return `/practice/${mode}${query ? `?${query}` : ''}`;
};
