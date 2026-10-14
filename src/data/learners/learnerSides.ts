/**
 * The two places learners live, each with its store and one repository per learner: this device
 * (guests and local mode) and the signed-in account. They are never mixed: the account side never
 * reads device data, except through the one-time offer in bringDeviceProgress.
 */
import { LocalRepository } from '../local/LocalRepository';
import { supabaseClient } from '../supabase/client';
import { SupabaseRepository } from '../supabase/SupabaseRepository';
import { AccountLearnerStore } from './accountLearnerStore';
import type { LearnerSide } from './bringDeviceProgress';
import { DeviceLearnerStore, deviceDatabaseName } from './deviceLearnerStore';

let deviceStore: DeviceLearnerStore | undefined;
const deviceRepositories = new Map<string, LocalRepository>();

export function deviceLearnerSide(): LearnerSide {
  return {
    store: (deviceStore ??= new DeviceLearnerStore()),
    repositoryFor(learnerId) {
      const name = deviceDatabaseName(learnerId);
      let repository = deviceRepositories.get(name);
      if (!repository) deviceRepositories.set(name, (repository = new LocalRepository(name)));
      return repository;
    },
  };
}

export function accountLearnerSide(accountId: string): LearnerSide {
  return {
    store: new AccountLearnerStore(supabaseClient(), accountId),
    repositoryFor: (learnerId) => new SupabaseRepository(supabaseClient(), learnerId),
  };
}

/** A device learner's database can only be deleted once nothing holds it open. */
export function closeDeviceRepository(learnerId: string): void {
  const name = deviceDatabaseName(learnerId);
  deviceRepositories.get(name)?.close();
  deviceRepositories.delete(name);
}
