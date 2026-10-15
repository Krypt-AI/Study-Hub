/**
 * Learners: the people studying on one device or under one account (siblings sharing a computer).
 * Every learner has their own progress, calendar and settings; this module holds the rules that
 * are the same wherever learners are stored.
 */
import { newId } from '@/lib/ids';
import type { LearnerRecord } from '../records';

/** The learner every device and every account starts with; it cannot be removed. */
export const MAIN_LEARNER_ID = 'main';
export const DEFAULT_LEARNER_NAME = 'Learner 1';
export const MAX_LEARNER_NAME_LENGTH = 30;

/** Where a list of learners is kept: this device (guests and local mode) or the signed-in account. */
export interface LearnerStore {
  readonly kind: 'device' | 'account';
  /** Oldest first, the main learner always included. */
  list(): Promise<LearnerRecord[]>;
  save(record: LearnerRecord): Promise<void>;
  /** Removes the learner and everything they saved. The main learner cannot be removed. */
  remove(id: string): Promise<void>;
  /** The learner chosen last time on this device, if there is one. */
  activeId(): string | undefined;
  setActiveId(id: string): void;
}

/** The trimmed name, or a message saying why it cannot be used. */
export function checkLearnerName(name: string, learners: LearnerRecord[], renaming?: string): { name: string } | { error: string } {
  const trimmed = name.trim().replace(/\s+/gu, ' ');
  if (!trimmed) return { error: 'Type a name.' };
  if (trimmed.length > MAX_LEARNER_NAME_LENGTH) return { error: `Use ${MAX_LEARNER_NAME_LENGTH} letters or fewer.` };
  const taken = learners.some((learner) => learner.id !== renaming && learner.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  if (taken) return { error: `There is already a profile called ${trimmed}.` };
  return { name: trimmed };
}

export function newLearner(name: string, now = new Date()): LearnerRecord {
  const timestamp = now.toISOString();
  return { id: newId(), name, createdAt: timestamp, updatedAt: timestamp };
}

export function mainLearner(now = new Date()): LearnerRecord {
  const timestamp = now.toISOString();
  return { id: MAIN_LEARNER_ID, name: DEFAULT_LEARNER_NAME, createdAt: timestamp, updatedAt: timestamp };
}

/** The learner to open: the one chosen last time if it still exists, else the main learner. */
export function pickActiveLearner(learners: LearnerRecord[], chosenId: string | undefined): LearnerRecord {
  const chosen = learners.find((learner) => learner.id === chosenId);
  return chosen ?? learners.find((learner) => learner.id === MAIN_LEARNER_ID) ?? learners[0] ?? mainLearner();
}

/** Oldest first, with the main learner at the top. */
export function sortLearners(learners: LearnerRecord[]): LearnerRecord[] {
  return [...learners].sort((a, b) => Number(b.id === MAIN_LEARNER_ID) - Number(a.id === MAIN_LEARNER_ID) || a.createdAt.localeCompare(b.createdAt));
}
