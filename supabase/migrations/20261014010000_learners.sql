-- Several learners per account, and unfinished mock-exam sittings saved to the account.
--
-- An account can hold several learners (for example siblings sharing one sign-in). Every
-- learner table gains learner_id, part of its key, and a foreign key to the learner, so a
-- learner's rows can only exist under one of the account's own learners and are deleted with
-- it. Each account has a learner 'main', created for existing accounts here and for new ones
-- by a trigger; existing rows belong to it.
--
-- Deploy this together with the app version that sends learner_id: older app versions
-- upsert on (user_id, id), which no longer matches a key.

-- ---------------------------------------------------------------------------
-- Learners
-- ---------------------------------------------------------------------------

create table public.learners (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint learners_id_matches_record check (id = record ->> 'id'),
  constraint learners_name_present check (length(btrim(record ->> 'name')) > 0)
);

alter table public.learners enable row level security;
create policy "Own learners" on public.learners for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.learners from anon, authenticated;
grant select, insert, update, delete on public.learners to authenticated;

-- The main learner is the account itself; it cannot be removed while the account exists.
-- Security definer: it reads auth.users, which the API roles cannot.
create function public.keep_main_learner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.id = 'main' and exists (select 1 from auth.users where id = old.user_id) then
    raise exception 'The main learner cannot be removed';
  end if;
  return old;
end;
$$;
create trigger keep_main_learner before delete on public.learners
  for each row execute function public.keep_main_learner();

create function public.create_main_learner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.learners (user_id, id, record)
  values (
    new.id,
    'main',
    jsonb_build_object(
      'id', 'main',
      'name', coalesce(nullif(btrim(split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), ' ', 1)), ''), 'Learner 1'),
      'createdAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'updatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  )
  on conflict (user_id, id) do nothing;
  return new;
end;
$$;
revoke execute on function public.create_main_learner() from public, anon, authenticated;
revoke execute on function public.keep_main_learner() from public, anon, authenticated;

create trigger create_main_learner after insert on auth.users
  for each row execute function public.create_main_learner();

-- Existing accounts.
insert into public.learners (user_id, id, record)
select
  u.id,
  'main',
  jsonb_build_object(
    'id', 'main',
    'name', coalesce(nullif(btrim(split_part(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), ' ', 1)), ''), 'Learner 1'),
    'createdAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'updatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  )
from auth.users u
on conflict (user_id, id) do nothing;

-- ---------------------------------------------------------------------------
-- Unfinished mock-exam sittings
-- ---------------------------------------------------------------------------

create table public.exam_drafts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint exam_drafts_id_matches_record check (id = record ->> 'id')
);

alter table public.exam_drafts enable row level security;
create policy "Own exam drafts" on public.exam_drafts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.exam_drafts from anon, authenticated;
grant select, insert, update, delete on public.exam_drafts to authenticated;

-- ---------------------------------------------------------------------------
-- learner_id on every learner table
-- ---------------------------------------------------------------------------
-- The notebook's tables (notes, note_folders) stay account-wide: they are read only, to let
-- the account download notes written before the notebook was removed.

do $$
declare
  learner_table text;
begin
  foreach learner_table in array array[
    'attempts', 'lesson_progress', 'review_states', 'topic_mastery', 'code_projects', 'code_versions',
    'custom_exercises', 'submissions', 'bookmarks', 'certification_progress', 'activity_days', 'settings',
    'semesters', 'timetable_classes', 'important_dates', 'exam_drafts'
  ] loop
    execute format('alter table public.%I add column learner_id text not null default %L', learner_table, 'main');
    execute format('alter table public.%I drop constraint %I', learner_table, learner_table || '_pkey');
    execute format('alter table public.%I add primary key (user_id, learner_id, id)', learner_table);
    execute format(
      'alter table public.%I add constraint %I foreign key (user_id, learner_id) references public.learners (user_id, id) on delete cascade',
      learner_table, learner_table || '_learner_fkey'
    );
  end loop;
end;
$$;

-- Lookups now run within one learner.
drop index public.attempts_by_time, public.attempts_by_question, public.attempts_by_course,
  public.lesson_progress_by_course, public.review_states_by_due, public.code_versions_by_project,
  public.submissions_by_exercise;
create index attempts_by_time on public.attempts (user_id, learner_id, created_at desc);
create index attempts_by_question on public.attempts (user_id, learner_id, question_id);
create index attempts_by_course on public.attempts (user_id, learner_id, course_id);
create index lesson_progress_by_course on public.lesson_progress (user_id, learner_id, course_id);
create index review_states_by_due on public.review_states (user_id, learner_id, due);
create index code_versions_by_project on public.code_versions (user_id, learner_id, project_id, created_at desc);
create index submissions_by_exercise on public.submissions (user_id, learner_id, exercise_id, created_at desc);

-- ---------------------------------------------------------------------------
-- record_activity, per learner
-- ---------------------------------------------------------------------------
-- The two-argument version upserted on (user_id, id), which is no longer a key.

drop function public.record_activity(text, jsonb);

create function public.record_activity(p_learner text, p_day text, p_delta jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  counters constant text[] := array['minutes', 'attempts', 'correct', 'lessonsCompleted', 'codeRuns'];
  counter text;
  merged jsonb;
begin
  insert into public.activity_days (learner_id, id, record)
  values (
    p_learner,
    p_day,
    jsonb_build_object('day', p_day, 'minutes', 0, 'attempts', 0, 'correct', 0, 'lessonsCompleted', 0, 'codeRuns', 0)
  )
  on conflict (user_id, learner_id, id) do nothing;

  select record into merged
  from public.activity_days
  where user_id = (select auth.uid()) and learner_id = p_learner and id = p_day
  for update;

  foreach counter in array counters loop
    if p_delta ? counter then
      merged := jsonb_set(merged, array[counter], to_jsonb(coalesce((merged ->> counter)::numeric, 0) + (p_delta ->> counter)::numeric));
    end if;
  end loop;
  merged := jsonb_set(merged, '{updatedAt}', to_jsonb(to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));

  update public.activity_days set record = merged
  where user_id = (select auth.uid()) and learner_id = p_learner and id = p_day;
end;
$$;

revoke all on function public.record_activity(text, text, jsonb) from public, anon;
grant execute on function public.record_activity(text, text, jsonb) to authenticated;
