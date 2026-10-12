/**
 * Row level security, checked on a real Postgres (PGlite) with the migrations applied:
 * learners reach only their own rows, signed-out requests get nothing, and the atomic
 * functions keep to the caller's rows.
 */
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations/', import.meta.url));
const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';

/** The parts of a Supabase database the migrations rely on: auth.users, auth.uid() and the API roles. */
const SUPABASE_STANDINS = `
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;

let db: PGlite;

/** Runs statements as a signed-in learner (or signed out with `null`), like requests through the API. */
async function as<T>(user: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(user ? `set role authenticated; set request.jwt.claim.sub = '${user}';` : `set role anon; set request.jwt.claim.sub = '';`);
  try {
    return await run();
  } finally {
    await db.exec('reset role; reset request.jwt.claim.sub;');
  }
}

const importantDate = (id: string, extra: Record<string, unknown> = {}) => JSON.stringify({ id, title: id, kind: 'quiz', date: '2026-11-02', createdAt: 'a', updatedAt: 'a', ...extra });
/** The removed notebook's tables are still created by the first migration. */
const note = (id: string, extra: Record<string, unknown> = {}) => JSON.stringify({ id, title: id, body: '', folderId: null, tags: [], pinned: false, links: [], linkKeys: [], ...extra });

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(SUPABASE_STANDINS);
  for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(`${MIGRATIONS_DIR}${file}`, 'utf8'));
  }
  await db.query('insert into auth.users (id) values ($1), ($2)', [ALICE, BOB]);
}, 60_000);

afterAll(async () => {
  await db.close();
});

describe('row level security', () => {
  it('is enabled, with a policy, on every table in the public schema', async () => {
    const unprotected = await db.query<{ relname: string }>(`
      select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
        and (not c.relrowsecurity or not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname))
    `);
    expect(unprotected.rows).toEqual([]);
  });

  it('fills user_id from the session and keeps rows private to their owner', async () => {
    await as(ALICE, () => db.query(`insert into public.important_dates (id, record) values ('n1', $1)`, [importantDate('n1')]));
    const owner = await db.query<{ user_id: string }>(`select user_id from public.important_dates where id = 'n1'`);
    expect(owner.rows).toEqual([{ user_id: ALICE }]);

    const seenByBob = await as(BOB, () => db.query(`select id from public.important_dates`));
    expect(seenByBob.rows).toEqual([]);
    const updatedByBob = await as(BOB, () => db.query(`update public.important_dates set record = $1 where id = 'n1'`, [importantDate('n1', { title: 'changed' })]));
    expect(updatedByBob.affectedRows).toBe(0);
    const deletedByBob = await as(BOB, () => db.query(`delete from public.important_dates where id = 'n1'`));
    expect(deletedByBob.affectedRows).toBe(0);

    const seenByAlice = await as(ALICE, () => db.query<{ title: string }>(`select record ->> 'title' as title from public.important_dates`));
    expect(seenByAlice.rows).toEqual([{ title: 'n1' }]);
  });

  it('rejects rows written for someone else', async () => {
    await expect(as(BOB, () => db.query(`insert into public.important_dates (user_id, id, record) values ($1, 'n2', $2)`, [ALICE, importantDate('n2')]))).rejects.toThrow(/row-level security/u);
  });

  it('gives signed-out requests no access', async () => {
    await expect(as(null, () => db.query(`select id from public.important_dates`))).rejects.toThrow(/permission denied/u);
    await expect(as(null, () => db.query(`select public.record_activity('2026-10-11', '{"minutes": 1}')`))).rejects.toThrow(/permission denied/u);
  });

  it('keeps the row key equal to the record id', async () => {
    await expect(as(ALICE, () => db.query(`insert into public.important_dates (id, record) values ('n3', $1)`, [importantDate('other')]))).rejects.toThrow(/important_dates_id_matches_record/u);
  });
});

describe('atomic functions', () => {
  it('adds activity to the caller’s own day', async () => {
    await as(ALICE, () => db.query(`select public.record_activity('2026-10-11', '{"minutes": 1, "attempts": 2}')`));
    await as(ALICE, () => db.query(`select public.record_activity('2026-10-11', '{"minutes": 1, "correct": 1}')`));
    await as(BOB, () => db.query(`select public.record_activity('2026-10-11', '{"minutes": 5}')`));

    const alice = await as(ALICE, () => db.query<{ record: Record<string, unknown> }>(`select record from public.activity_days`));
    expect(alice.rows).toHaveLength(1);
    expect(alice.rows[0]?.record).toMatchObject({ day: '2026-10-11', minutes: 2, attempts: 2, correct: 1, codeRuns: 0 });
    const bob = await as(BOB, () => db.query<{ minutes: string }>(`select record ->> 'minutes' as minutes from public.activity_days`));
    expect(bob.rows).toEqual([{ minutes: '5' }]);
  });

  it('moves a deleted folder’s notes and sub-folders to its parent', async () => {
    const folder = (id: string, parentId: string | null) => JSON.stringify({ id, name: id, parentId, createdAt: '', updatedAt: '' });
    await as(ALICE, async () => {
      await db.query(`insert into public.note_folders (id, record) values ('top', $1), ('middle', $2), ('child', $3)`, [folder('top', null), folder('middle', 'top'), folder('child', 'middle')]);
      await db.query(`insert into public.notes (id, record) values ('filed', $1)`, [note('filed', { folderId: 'middle' })]);
    });
    // Another learner cannot delete it.
    await as(BOB, () => db.query(`select public.delete_note_folder('middle')`));
    await as(ALICE, () => db.query(`select public.delete_note_folder('middle')`));

    const state = await as(ALICE, async () => ({
      folders: (await db.query<{ id: string; parent_id: string | null }>(`select id, parent_id from public.note_folders order by id`)).rows,
      note: (await db.query<{ folder_id: string | null }>(`select folder_id from public.notes where id = 'filed'`)).rows,
    }));
    expect(state.folders).toEqual([
      { id: 'child', parent_id: 'top' },
      { id: 'top', parent_id: null },
    ]);
    expect(state.note).toEqual([{ folder_id: 'top' }]);
  });
});
