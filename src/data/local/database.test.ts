import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { openStudyDatabase } from './database';

describe('the browser database', () => {
  it('rewrites classes stored as tutorials or "other" as lectures when it upgrades', async () => {
    const name = 'upgrade-class-kinds';
    // A database as version 3 left it.
    const old = new Dexie(name);
    old.version(3).stores({ timetableClasses: 'id, term' });
    await old.table('timetableClasses').bulkPut([
      { id: 't', kind: 'tutorial' },
      { id: 'o', kind: 'other' },
      { id: 'l', kind: 'lab' },
    ]);
    old.close();

    const upgraded = openStudyDatabase(name);
    await upgraded.open();
    upgraded.close();

    // Read the stored rows directly, without the repository's read-time normalising.
    const raw = new Dexie(name);
    await raw.open();
    const kinds = (await raw.table<{ id: string; kind: string }>('timetableClasses').toArray()).map((row) => [row.id, row.kind]);
    raw.close();
    expect(kinds).toEqual([
      ['l', 'lab'],
      ['o', 'lecture'],
      ['t', 'lecture'],
    ]);
  });
});
