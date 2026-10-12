-- Study Hub: everything a learner owns, private to that learner.
--
-- Each table stores the app's record as JSONB (`record`), the same shape the app keeps in
-- IndexedDB (src/data/records.ts), so both backends share one data model. Columns the app
-- filters or sorts on are generated from the record and can never disagree with it.
--
-- Security: row level security is enabled on every table. Signed-in learners can read and
-- write only rows whose user_id is their own; user_id defaults to auth.uid(), so the client
-- never sends it. The anon role has no policies and no privileges. Only the public anon key
-- is used by the browser; the service_role key must never reach the client.

-- Answers -------------------------------------------------------------------------------

create table public.attempts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  question_id text generated always as (record ->> 'questionId') stored,
  course_id text generated always as (record ->> 'courseId') stored,
  -- ISO-8601 UTC timestamps from the app; they sort chronologically as text.
  created_at text generated always as (record ->> 'createdAt') stored,
  primary key (user_id, id),
  constraint attempts_id_matches_record check (id = record ->> 'id')
);
create index attempts_by_time on public.attempts (user_id, created_at desc);
create index attempts_by_question on public.attempts (user_id, question_id);
create index attempts_by_course on public.attempts (user_id, course_id);

create table public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  course_id text generated always as (record ->> 'courseId') stored,
  primary key (user_id, id),
  constraint lesson_progress_id_matches_record check (id = record ->> 'lessonId')
);
create index lesson_progress_by_course on public.lesson_progress (user_id, course_id);

create table public.review_states (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  due text generated always as (record ->> 'due') stored,
  course_id text generated always as (record ->> 'courseId') stored,
  primary key (user_id, id),
  constraint review_states_id_matches_record check (id = record ->> 'itemId')
);
create index review_states_by_due on public.review_states (user_id, due);

create table public.topic_mastery (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint topic_mastery_id_matches_record check (id = record ->> 'key')
);

-- Notebook ------------------------------------------------------------------------------

create table public.note_folders (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  parent_id text generated always as (record ->> 'parentId') stored,
  primary key (user_id, id),
  constraint note_folders_id_matches_record check (id = record ->> 'id')
);
create index note_folders_by_parent on public.note_folders (user_id, parent_id);

create table public.notes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  folder_id text generated always as (record ->> 'folderId') stored,
  updated_at text generated always as (record ->> 'updatedAt') stored,
  primary key (user_id, id),
  constraint notes_id_matches_record check (id = record ->> 'id')
);
create index notes_by_folder on public.notes (user_id, folder_id);

-- Code ----------------------------------------------------------------------------------

create table public.code_projects (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint code_projects_id_matches_record check (id = record ->> 'id')
);

create table public.code_versions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  project_id text generated always as (record ->> 'projectId') stored,
  created_at text generated always as (record ->> 'createdAt') stored,
  primary key (user_id, id),
  constraint code_versions_id_matches_record check (id = record ->> 'id')
);
create index code_versions_by_project on public.code_versions (user_id, project_id, created_at desc);

create table public.custom_exercises (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint custom_exercises_id_matches_record check (id = record ->> 'id')
);

create table public.submissions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  exercise_id text generated always as (record ->> 'exerciseId') stored,
  created_at text generated always as (record ->> 'createdAt') stored,
  primary key (user_id, id),
  constraint submissions_id_matches_record check (id = record ->> 'id')
);
create index submissions_by_exercise on public.submissions (user_id, exercise_id, created_at desc);

-- Planning and activity -----------------------------------------------------------------

create table public.bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint bookmarks_id_matches_record check (id = record ->> 'key')
);

create table public.certification_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint certification_progress_id_matches_record check (id = record ->> 'certId')
);

create table public.activity_days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint activity_days_id_matches_record check (id = record ->> 'day')
);

create table public.settings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null default 'settings',
  record jsonb not null,
  primary key (user_id, id),
  constraint settings_single_row check (id = 'settings')
);

-- Row level security: each learner reaches only their own rows ---------------------------

alter table public.attempts enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.review_states enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.note_folders enable row level security;
alter table public.notes enable row level security;
alter table public.code_projects enable row level security;
alter table public.code_versions enable row level security;
alter table public.custom_exercises enable row level security;
alter table public.submissions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.certification_progress enable row level security;
alter table public.activity_days enable row level security;
alter table public.settings enable row level security;

-- `(select auth.uid())` is evaluated once per statement instead of once per row.
create policy "Own attempts" on public.attempts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own lesson progress" on public.lesson_progress for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own review states" on public.review_states for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own topic mastery" on public.topic_mastery for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own note folders" on public.note_folders for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own notes" on public.notes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own code projects" on public.code_projects for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own code versions" on public.code_versions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own custom exercises" on public.custom_exercises for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own submissions" on public.submissions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own bookmarks" on public.bookmarks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own certification progress" on public.certification_progress for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own activity days" on public.activity_days for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own settings" on public.settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Signed-out requests get no access at all, not just zero rows.
revoke all on
  public.attempts, public.lesson_progress, public.review_states, public.topic_mastery,
  public.note_folders, public.notes, public.code_projects, public.code_versions,
  public.custom_exercises, public.submissions, public.bookmarks, public.certification_progress,
  public.activity_days, public.settings
from anon;

-- Atomic operations ---------------------------------------------------------------------
-- Both run as the caller (security invoker), so row level security still applies.

-- Adds counters to a day's activity, creating the day first; safe under concurrent calls.
create function public.record_activity(p_day text, p_delta jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  counters constant text[] := array['minutes', 'attempts', 'correct', 'lessonsCompleted', 'codeRuns', 'notesSaved'];
  counter text;
  merged jsonb;
begin
  insert into public.activity_days (id, record)
  values (
    p_day,
    jsonb_build_object('day', p_day, 'minutes', 0, 'attempts', 0, 'correct', 0, 'lessonsCompleted', 0, 'codeRuns', 0, 'notesSaved', 0)
  )
  on conflict (user_id, id) do nothing;

  select record into merged
  from public.activity_days
  where user_id = (select auth.uid()) and id = p_day
  for update;

  foreach counter in array counters loop
    if p_delta ? counter then
      merged := jsonb_set(merged, array[counter], to_jsonb(coalesce((merged ->> counter)::numeric, 0) + (p_delta ->> counter)::numeric));
    end if;
  end loop;
  merged := jsonb_set(merged, '{updatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));

  update public.activity_days set record = merged
  where user_id = (select auth.uid()) and id = p_day;
end;
$$;

-- Deletes a folder; its notes and sub-folders move to the folder's parent.
create function public.delete_note_folder(p_id text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  parent jsonb;
begin
  select coalesce(record -> 'parentId', 'null'::jsonb) into parent
  from public.note_folders
  where user_id = (select auth.uid()) and id = p_id;
  if not found then
    return;
  end if;

  update public.notes set record = jsonb_set(record, '{folderId}', parent)
  where user_id = (select auth.uid()) and folder_id = p_id;
  update public.note_folders set record = jsonb_set(record, '{parentId}', parent)
  where user_id = (select auth.uid()) and parent_id = p_id;
  delete from public.note_folders where user_id = (select auth.uid()) and id = p_id;
end;
$$;

revoke all on function public.record_activity(text, jsonb) from public, anon;
revoke all on function public.delete_note_folder(text) from public, anon;
grant execute on function public.record_activity(text, jsonb) to authenticated;
grant execute on function public.delete_note_folder(text) to authenticated;
