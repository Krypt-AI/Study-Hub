/**
 * The learners of the signed-in account, in the Supabase table `learners` (row level security keeps
 * them private to the account). The database creates the main learner with the account and deletes
 * a removed learner's rows with it. Which learner was open last is remembered on this device only.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LearnerRecord } from '../records';
import { readActiveId, writeActiveId } from './deviceLearnerStore';
import { type LearnerStore, MAIN_LEARNER_ID, mainLearner, sortLearners } from './learners';

export class AccountLearnerStore implements LearnerStore {
  readonly kind = 'account' as const;

  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async list() {
    const { data, error } = await this.client.from('learners').select('record');
    if (error) throw new Error(`Supabase request failed (learners): ${error.message}`);
    const learners = ((data ?? []) as Array<{ record: LearnerRecord }>).map((row) => row.record);
    if (learners.some((learner) => learner.id === MAIN_LEARNER_ID)) return sortLearners(learners);
    // The database creates it with the account; this covers an account made before that existed.
    const main = mainLearner();
    await this.save(main);
    return sortLearners([main, ...learners]);
  }

  async save(record: LearnerRecord) {
    const { error } = await this.client.from('learners').upsert({ id: record.id, record }, { onConflict: 'user_id,id' });
    if (error) throw new Error(`Supabase request failed (learners): ${error.message}`);
  }

  async remove(id: string) {
    if (id === MAIN_LEARNER_ID) throw new Error('The account’s first learner cannot be removed.');
    const { error } = await this.client.from('learners').delete().eq('id', id);
    if (error) throw new Error(`Supabase request failed (learners): ${error.message}`);
  }

  activeId() {
    return readActiveId(this.activeKey());
  }

  setActiveId(id: string) {
    writeActiveId(this.activeKey(), id);
  }

  private activeKey() {
    return `study-hub:active-learner:${this.userId}`;
  }
}
