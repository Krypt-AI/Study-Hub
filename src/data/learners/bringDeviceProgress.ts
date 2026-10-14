/**
 * The one-time offer after signing in: copy what this device's learners saved into the account.
 * It is offered only when the device has progress and the account has none, and it reuses the
 * backup import (merge), so nothing in the account is overwritten.
 */
import type { LearnerRecord } from '../records';
import type { StudyRepository } from '../repository';
import { type LearnerStore, MAIN_LEARNER_ID } from './learners';

export interface LearnerSide {
  store: LearnerStore;
  repositoryFor(learnerId: string): StudyRepository;
}

async function anyHasProgress(side: LearnerSide, learners: LearnerRecord[]): Promise<boolean> {
  for (const learner of learners) if (!(await side.repositoryFor(learner.id).isEmpty())) return true;
  return false;
}

export type DeviceProgressOffer = 'offer' | 'nothing-on-device' | 'account-has-progress';

/** Offer only when the device has something to bring and the account has nothing yet; the device is checked first. */
export async function checkDeviceProgressOffer(device: LearnerSide, account: LearnerSide): Promise<DeviceProgressOffer> {
  if (!(await anyHasProgress(device, await device.store.list()))) return 'nothing-on-device';
  return (await anyHasProgress(account, await account.store.list())) ? 'account-has-progress' : 'offer';
}

/** A name not yet used in the account: "Adik", else "Adik 2", "Adik 3"… */
function freeName(name: string, taken: LearnerRecord[]): string {
  const used = new Set(taken.map((learner) => learner.name.toLocaleLowerCase()));
  if (!used.has(name.toLocaleLowerCase())) return name;
  for (let suffix = 2; ; suffix++) if (!used.has(`${name} ${suffix}`.toLocaleLowerCase())) return `${name} ${suffix}`;
}

/**
 * Copies every device learner into the account: the device's main learner into the account's main
 * learner, every other learner into an account learner with the same id and name. Every write is
 * an upsert under the same ids, so running it again after a failure copies nothing twice.
 * Returns how many learners were copied.
 */
export async function bringDeviceProgress(device: LearnerSide, account: LearnerSide): Promise<number> {
  const accountLearners = await account.store.list();
  const deviceLearners = await device.store.list();
  for (const learner of deviceLearners) {
    if (learner.id !== MAIN_LEARNER_ID && !accountLearners.some((existing) => existing.id === learner.id)) {
      const copy = { ...learner, name: freeName(learner.name, accountLearners) };
      await account.store.save(copy);
      accountLearners.push(copy);
    }
    const backup = await device.repositoryFor(learner.id).exportAll();
    await account.repositoryFor(learner.id).importAll(backup, 'merge');
  }
  return deviceLearners.length;
}

/** Whether this account was already offered the device's progress (answered either way), on this device. */
export function wasOffered(accountId: string): boolean {
  try {
    return localStorage.getItem(offeredKey(accountId)) !== null;
  } catch {
    return true;
  }
}

export function markOffered(accountId: string): void {
  try {
    localStorage.setItem(offeredKey(accountId), new Date().toISOString());
  } catch {
    /* storage unavailable: the offer may appear again */
  }
}

const offeredKey = (accountId: string) => `study-hub:device-progress-offered:${accountId}`;
