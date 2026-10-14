/**
 * The learners of this device, used by guests and in local mode. They belong to the device, not to
 * any account: signing in or out never changes them. Each learner's data is a separate IndexedDB
 * database; the main learner keeps the original "study-hub" database, so data saved before
 * learners existed stays with them.
 */
import Dexie, { type EntityTable } from 'dexie';
import type { LearnerRecord } from '../records';
import { type LearnerStore, MAIN_LEARNER_ID, mainLearner, sortLearners } from './learners';

const DEVICE_DATABASE = 'study-hub-device';
const ACTIVE_KEY = 'study-hub:active-learner:device';

/** The IndexedDB database holding one device learner's data. */
export const deviceDatabaseName = (learnerId: string) => (learnerId === MAIN_LEARNER_ID ? 'study-hub' : `study-hub-learner-${learnerId}`);

type DeviceDatabase = Dexie & { learners: EntityTable<LearnerRecord, 'id'> };

export class DeviceLearnerStore implements LearnerStore {
  readonly kind = 'device' as const;
  private readonly db: DeviceDatabase;

  constructor(databaseName = DEVICE_DATABASE) {
    this.db = new Dexie(databaseName) as DeviceDatabase;
    this.db.version(1).stores({ learners: 'id' });
  }

  async list() {
    const learners = await this.db.learners.toArray();
    if (learners.some((learner) => learner.id === MAIN_LEARNER_ID)) return sortLearners(learners);
    const main = mainLearner();
    await this.db.learners.put(main);
    return sortLearners([main, ...learners]);
  }

  async save(record: LearnerRecord) {
    await this.db.learners.put(record);
  }

  async remove(id: string) {
    if (id === MAIN_LEARNER_ID) throw new Error('The first learner on this device cannot be removed.');
    await Dexie.delete(deviceDatabaseName(id));
    await this.db.learners.delete(id);
  }

  activeId() {
    return readActiveId(ACTIVE_KEY);
  }

  setActiveId(id: string) {
    writeActiveId(ACTIVE_KEY, id);
  }

  /** Close the connection (tests). */
  close() {
    this.db.close();
  }
}

/** The last chosen learner is a convenience: without storage the main learner opens. */
export function readActiveId(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeActiveId(key: string, id: string): void {
  try {
    localStorage.setItem(key, id);
  } catch {
    /* storage unavailable */
  }
}
