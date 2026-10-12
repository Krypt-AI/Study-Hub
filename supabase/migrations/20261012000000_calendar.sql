-- Calendar: semester dates, the weekly timetable and important dates (quizzes, tests, exams).
-- Same pattern as the first migration: the app's record as JSONB, private to its learner.
-- The notebook's tables (notes, note_folders) are kept so existing notes can still be
-- downloaded from Settings; the app no longer writes to them.

create table public.semesters (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint semesters_id_matches_record check (id = record ->> 'term')
);

create table public.timetable_classes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  primary key (user_id, id),
  constraint timetable_classes_id_matches_record check (id = record ->> 'id')
);

create table public.important_dates (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  record jsonb not null,
  -- "YYYY-MM-DD"; sorts chronologically as text.
  date text generated always as (record ->> 'date') stored,
  primary key (user_id, id),
  constraint important_dates_id_matches_record check (id = record ->> 'id')
);
create index important_dates_by_date on public.important_dates (user_id, date);

alter table public.semesters enable row level security;
alter table public.timetable_classes enable row level security;
alter table public.important_dates enable row level security;

create policy "Own semesters" on public.semesters for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own timetable classes" on public.timetable_classes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own important dates" on public.important_dates for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.semesters, public.timetable_classes, public.important_dates from anon;
