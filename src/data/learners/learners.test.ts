import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { LocalRepository } from '../local/LocalRepository';
import type { LearnerRecord } from '../records';
import { bringDeviceProgress, checkDeviceProgressOffer, type LearnerSide } from './bringDeviceProgress';
import { DeviceLearnerStore, deviceDatabaseName } from './deviceLearnerStore';
import { checkLearnerName, MAIN_LEARNER_ID, mainLearner, newLearner, pickActiveLearner, sortLearners } from './learners';

const learner = (id: string, name: string, createdAt = '2026-10-01T00:00:00.000Z'): LearnerRecord => ({ id, name, createdAt, updatedAt: createdAt });

describe('learner names', () => {
  const learners = [learner(MAIN_LEARNER_ID, 'Aisyah'), learner('b', 'Adam')];

  it('trims and accepts a new name', () => {
    expect(checkLearnerName('  Siti   Nur ', learners)).toEqual({ name: 'Siti Nur' });
  });

  it('rejects an empty, too long or already used name', () => {
    expect(checkLearnerName('   ', learners)).toEqual({ error: 'Type a name.' });
    expect(checkLearnerName('x'.repeat(31), learners)).toHaveProperty('error');
    expect(checkLearnerName('adam', learners)).toEqual({ error: 'There is already a learner called adam.' });
  });

  it('lets a learner keep their own name when renaming', () => {
    expect(checkLearnerName('Adam', learners, 'b')).toEqual({ name: 'Adam' });
  });
});

describe('choosing the learner to open', () => {
  const learners = [learner(MAIN_LEARNER_ID, 'Aisyah'), learner('b', 'Adam')];

  it('opens the learner chosen last time, else the main learner', () => {
    expect(pickActiveLearner(learners, 'b').id).toBe('b');
    expect(pickActiveLearner(learners, 'removed').id).toBe(MAIN_LEARNER_ID);
    expect(pickActiveLearner(learners, undefined).id).toBe(MAIN_LEARNER_ID);
  });

  it('lists the main learner first, then the oldest', () => {
    const sorted = sortLearners([learner('c', 'C', '2026-10-03T00:00:00.000Z'), learner('b', 'B', '2026-10-02T00:00:00.000Z'), learner(MAIN_LEARNER_ID, 'M', '2026-10-09T00:00:00.000Z')]);
    expect(sorted.map((entry) => entry.id)).toEqual([MAIN_LEARNER_ID, 'b', 'c']);
  });
});

describe('device learners', () => {
  it('always has a main learner, keeping the original database', async () => {
    const store = new DeviceLearnerStore('device-test-main');
    expect((await store.list()).map((entry) => entry.id)).toEqual([MAIN_LEARNER_ID]);
    expect(deviceDatabaseName(MAIN_LEARNER_ID)).toBe('study-hub');
    await expect(store.remove(MAIN_LEARNER_ID)).rejects.toThrow(/cannot be removed/u);
    store.close();
  });

  it('removes a learner together with their database', async () => {
    const store = new DeviceLearnerStore('device-test-remove');
    const sibling = newLearner('Adam');
    await store.save(sibling);
    const repository = new LocalRepository(deviceDatabaseName(sibling.id));
    await repository.recordActivity('2026-10-14', { minutes: 5 });
    repository.close();

    await store.remove(sibling.id);
    expect((await store.list()).map((entry) => entry.id)).toEqual([MAIN_LEARNER_ID]);
    expect(await Dexie.exists(deviceDatabaseName(sibling.id))).toBe(false);
    store.close();
  });
});

describe('bringing the device’s progress into an account', () => {
  /** Two independent sides; the "account" is played by another set of local databases. */
  function sides(prefix: string): { device: LearnerSide; account: LearnerSide } {
    const side = (name: string): LearnerSide => {
      const repositories = new Map<string, LocalRepository>();
      return {
        store: new DeviceLearnerStore(`${prefix}-${name}-learners`),
        repositoryFor(id) {
          let repository = repositories.get(id);
          if (!repository) repositories.set(id, (repository = new LocalRepository(`${prefix}-${name}-${id}`)));
          return repository;
        },
      };
    };
    return { device: side('device'), account: side('account') };
  }

  it('is offered only when the device has progress and the account has none', async () => {
    const { device, account } = sides('offer');
    expect(await checkDeviceProgressOffer(device, account)).toBe('nothing-on-device');
    await device.repositoryFor(MAIN_LEARNER_ID).recordActivity('2026-10-14', { minutes: 5 });
    expect(await checkDeviceProgressOffer(device, account)).toBe('offer');
    await account.repositoryFor(MAIN_LEARNER_ID).recordActivity('2026-10-13', { minutes: 1 });
    expect(await checkDeviceProgressOffer(device, account)).toBe('account-has-progress');
  });

  it('copies every learner, keeping each learner’s data apart', async () => {
    const { device, account } = sides('bring');
    const sibling = newLearner('Adam');
    await device.store.save(sibling);
    await device.repositoryFor(MAIN_LEARNER_ID).saveImportantDate({ id: 'd1', title: 'Main’s quiz', kind: 'quiz', date: '2026-11-02', createdAt: 'a', updatedAt: 'a' });
    await device.repositoryFor(sibling.id).saveImportantDate({ id: 'd2', title: 'Adam’s test', kind: 'test', date: '2026-11-03', createdAt: 'a', updatedAt: 'a' });
    // The account already has a learner called Adam.
    await account.store.save({ ...newLearner('Adam'), createdAt: '2000-01-01T00:00:00.000Z' });

    expect(await bringDeviceProgress(device, account)).toBe(2);
    // Running it again (as after a failure) copies nothing twice.
    expect(await bringDeviceProgress(device, account)).toBe(2);

    const accountLearners = await account.store.list();
    expect(accountLearners.map((entry) => entry.name)).toEqual([mainLearner().name, 'Adam', 'Adam 2']);
    const copiedSibling = accountLearners.find((entry) => entry.id === sibling.id);
    expect(copiedSibling?.name).toBe('Adam 2');
    expect((await account.repositoryFor(MAIN_LEARNER_ID).listImportantDates()).map((date) => date.title)).toEqual(['Main’s quiz']);
    expect((await account.repositoryFor(sibling.id).listImportantDates()).map((date) => date.title)).toEqual(['Adam’s test']);
  });
});
