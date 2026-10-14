import { createContext, useContext } from 'react';
import type { LearnerRecord } from '../records';

export interface Learners {
  /** Device learners (guests, local mode) or the signed-in account's learners. */
  kind: 'device' | 'account';
  /** Main learner first, then oldest first. */
  list: LearnerRecord[];
  active: LearnerRecord;
  /** Opens another learner's data; nothing of the current learner stays in memory. */
  switchTo(id: string): void;
  /** Adds a learner and opens them; rejects with a message the learner can read when the name cannot be used. */
  add(name: string): Promise<LearnerRecord>;
  rename(id: string, name: string): Promise<void>;
  /** Removes the learner and everything they saved. */
  remove(id: string): Promise<void>;
  /** Reloads the list, after learners were added elsewhere (e.g. brought in from the device). */
  refresh(): Promise<void>;
}

export const LearnersContext = createContext<Learners | null>(null);

export function useLearners(): Learners {
  const learners = useContext(LearnersContext);
  if (!learners) throw new Error('useLearners must be used inside RepositoryProvider');
  return learners;
}
