/**
 * Row level security, checked on a real Postgres (PGlite) with the migrations applied:
 * learners reach only their own rows, signed-out requests get nothing, the atomic
 * functions keep to the caller's rows, profiles stay private to their owner, and an account's
 * learners keep their rows apart.
 */
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations/', import.meta.url));
const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';

/**
 * The parts of a Supabase database the migrations rely on: auth.users, auth.uid() and the API roles.
 * Like Supabase projects created since 30 May 2026, tables get no default privileges for the API
 * roles: the migrations must grant every privilege the app needs.
 */
const SUPABASE_STANDINS = `
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}',
    raw_app_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

/** Projects created before 30 May 2026 granted every table privilege to the API roles by default. */
const OLDER_PROJECT_DEFAULTS = 'alter default privileges in schema public grant all on tables to anon, authenticated;';

/** Every table the app reads and writes as a signed-in learner (profiles has its own narrower grants). */
const LEARNER_TABLES = [
  'attempts', 'lesson_progress', 'review_states', 'topic_mastery', 'note_folders', 'notes', 'code_projects', 'code_versions',
  'custom_exercises', 'submissions', 'bookmarks', 'certification_progress', 'activity_days', 'settings',
  'semesters', 'timetable_classes', 'important_dates', 'exam_drafts', 'learners',
];

let db: PGlite;

/** A fresh database with the Supabase stand-ins, the given default privileges and every migration. */
async function migratedDatabase(defaultPrivileges = ''): Promise<PGlite> {
  const database = await PGlite.create();
  await database.exec(SUPABASE_STANDINS + defaultPrivileges);
  for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()) {
    await database.exec(readFileSync(`${MIGRATIONS_DIR}${file}`, 'utf8'));
  }
  return database;
}

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
  db = await migratedDatabase();
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
      ($1, 'alice@example.com', '{"full_name": "Alice A", "avatar_url": "https://example.com/a.png"}', '{"providers": ["google"]}'),
      ($2, 'bob@example.com', '{"user_name": "bobcodes"}', '{"providers": ["github"]}')`,
    [ALICE, BOB],
  );
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
    await expect(as(null, () => db.query(`select public.record_activity('main', '2026-10-11', '{"minutes": 1}')`))).rejects.toThrow(/permission denied/u);
  });

  it('keeps the row key equal to the record id', async () => {
    await expect(as(ALICE, () => db.query(`insert into public.important_dates (id, record) values ('n3', $1)`, [importantDate('other')]))).rejects.toThrow(/important_dates_id_matches_record/u);
  });
});

describe.each([
  ['created since 30 May 2026', ''],
  ['created earlier, with default grants', OLDER_PROJECT_DEFAULTS],
])('table privileges on a project %s', (_kind, defaultPrivileges) => {
  it('lets signed-in learners read and write their tables, with nothing that bypasses row level security, and gives anon nothing', async () => {
    const database = await migratedDatabase(defaultPrivileges);
    /** The tables on which `role` holds (any of) `privileges`, or, with `holds` false, does not. */
    const tablesWhere = async (role: string, privileges: string, tables: string[], holds: boolean) =>
      (
        await database.query<{ name: string }>(
          `select t.name from unnest($1::text[]) as t(name) where has_table_privilege($2, format('public.%I', t.name), $3) = $4`,
          [tables, role, privileges, holds],
        )
      ).rows.map((row) => row.name);
    try {
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) expect(await tablesWhere('authenticated', privilege, LEARNER_TABLES, false)).toEqual([]);
      // TRUNCATE ignores row level security.
      expect(await tablesWhere('authenticated', 'TRUNCATE, REFERENCES, TRIGGER', [...LEARNER_TABLES, 'profiles'], true)).toEqual([]);
      expect(await tablesWhere('anon', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE', [...LEARNER_TABLES, 'profiles'], true)).toEqual([]);
    } finally {
      await database.close();
    }
  }, 60_000);
});

describe('atomic functions', () => {
  it('adds activity to the caller’s own day', async () => {
    await as(ALICE, () => db.query(`select public.record_activity('main', '2026-10-11', '{"minutes": 1, "attempts": 2}')`));
    await as(ALICE, () => db.query(`select public.record_activity('main', '2026-10-11', '{"minutes": 1, "correct": 1}')`));
    await as(BOB, () => db.query(`select public.record_activity('main', '2026-10-11', '{"minutes": 5}')`));

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

describe('accounts', () => {
  it('copies each user’s sign-in details into a profile only they can read', async () => {
    const alice = await as(ALICE, () => db.query(`select email, display_name, avatar_url, providers from public.profiles`));
    expect(alice.rows).toEqual([{ email: 'alice@example.com', display_name: 'Alice A', avatar_url: 'https://example.com/a.png', providers: ['google'] }]);
    const bob = await as(BOB, () => db.query(`select display_name from public.profiles`));
    expect(bob.rows).toEqual([{ display_name: 'bobcodes' }]);
    await expect(as(null, () => db.query(`select * from public.profiles`))).rejects.toThrow(/permission denied/u);
  });

  it('lets users rename themselves but not change the copied details', async () => {
    await as(ALICE, () => db.query(`update public.profiles set display_name = 'Ali'`));
    await expect(as(ALICE, () => db.query(`update public.profiles set email = 'x@example.com'`))).rejects.toThrow(/permission denied/u);
    const renamedByBob = await as(BOB, () => db.query(`update public.profiles set display_name = 'hacked' where user_id = '${ALICE}'`));
    expect(renamedByBob.affectedRows).toBe(0);

    // A later sign-in refreshes the copied details but keeps the chosen name.
    await db.query(`update auth.users set raw_app_meta_data = '{"providers": ["google", "github"]}' where id = $1`, [ALICE]);
    const alice = await as(ALICE, () => db.query(`select display_name, providers from public.profiles`));
    expect(alice.rows).toEqual([{ display_name: 'Ali', providers: ['google', 'github'] }]);
  });
});

describe('learners', () => {
  const learner = (id: string, name: string) => JSON.stringify({ id, name, createdAt: 'a', updatedAt: 'a' });
  const draft = (id: string) => JSON.stringify({ id, courseId: 'jlpt-n5', assessmentId: 'mock', sectionIndex: 0, answers: {} });

  it('gives every account a main learner named after the sign-in, private to the account', async () => {
    const alice = await as(ALICE, () => db.query<{ id: string; name: string }>(`select id, record ->> 'name' as name from public.learners`));
    expect(alice.rows).toEqual([{ id: 'main', name: 'Alice' }]);
    const bob = await as(BOB, () => db.query<{ name: string }>(`select record ->> 'name' as name from public.learners`));
    expect(bob.rows).toEqual([{ name: 'Learner 1' }]);
    await expect(as(null, () => db.query(`select * from public.learners`))).rejects.toThrow(/permission denied/u);
  });

  it('keeps a row under one of the account’s own learners', async () => {
    await as(ALICE, () => db.query(`insert into public.learners (id, record) values ('kid', $1)`, [learner('kid', 'Adik')]));
    await as(ALICE, () => db.query(`insert into public.important_dates (learner_id, id, record) values ('kid', 'k1', $1)`, [importantDate('k1')]));
    // The same id under another learner is a different row.
    await as(ALICE, () => db.query(`insert into public.important_dates (learner_id, id, record) values ('main', 'k1', $1)`, [importantDate('k1')]));
    const rows = await as(ALICE, () => db.query<{ learner_id: string }>(`select learner_id from public.important_dates where id = 'k1' order by learner_id`));
    expect(rows.rows).toEqual([{ learner_id: 'kid' }, { learner_id: 'main' }]);
    // Bob has no learner "kid": Alice's learner cannot be borrowed.
    await expect(as(BOB, () => db.query(`insert into public.important_dates (learner_id, id, record) values ('kid', 'b1', $1)`, [importantDate('b1')]))).rejects.toThrow(/foreign key/u);
  });

  it('keeps activity per learner', async () => {
    await as(ALICE, () => db.query(`select public.record_activity('kid', '2026-10-12', '{"minutes": 3}')`));
    await as(ALICE, () => db.query(`select public.record_activity('main', '2026-10-12', '{"minutes": 7}')`));
    const days = await as(ALICE, () => db.query<{ learner_id: string; minutes: string }>(`select learner_id, record ->> 'minutes' as minutes from public.activity_days where id = '2026-10-12' order by learner_id`));
    expect(days.rows).toEqual([{ learner_id: 'kid', minutes: '3' }, { learner_id: 'main', minutes: '7' }]);
  });

  it('keeps unfinished exam sittings private to their owner', async () => {
    await as(ALICE, () => db.query(`insert into public.exam_drafts (learner_id, id, record) values ('kid', 'jlpt-n5/mock', $1)`, [draft('jlpt-n5/mock')]));
    expect((await as(BOB, () => db.query(`select id from public.exam_drafts`))).rows).toEqual([]);
    await expect(as(null, () => db.query(`select id from public.exam_drafts`))).rejects.toThrow(/permission denied/u);
  });

  it('removes a learner with all of its rows, but never the main learner', async () => {
    await as(ALICE, () => db.query(`delete from public.learners where id = 'kid'`));
    const left = await as(ALICE, () => db.query<{ n: number }>(
      `select (select count(*) from public.important_dates where learner_id = 'kid')
            + (select count(*) from public.activity_days where learner_id = 'kid')
            + (select count(*) from public.exam_drafts where learner_id = 'kid') as n`,
    ));
    expect(Number(left.rows[0]?.n)).toBe(0);
    expect((await as(ALICE, () => db.query(`select id from public.important_dates where id = 'k1'`))).rows).toHaveLength(1);
    await expect(as(ALICE, () => db.query(`delete from public.learners where id = 'main'`))).rejects.toThrow(/main learner cannot be removed/u);
  });

  it('deletes everything, the main learner included, when the account is deleted', async () => {
    await db.query(`delete from auth.users where id = $1`, [ALICE]);
    const left = await db.query<{ n: number }>(`select (select count(*) from public.learners where user_id = $1) + (select count(*) from public.important_dates where user_id = $1) as n`, [ALICE]);
    expect(Number(left.rows[0]?.n)).toBe(0);
  });
});
