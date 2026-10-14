-- Explicit privileges for signed-in learners.
--
-- Supabase projects created since 30 May 2026 no longer grant table privileges to the API roles
-- by default (and from 30 October 2026 neither do new tables in older projects). The earlier
-- migrations relied on that default, so on such a project every request from a signed-in learner
-- would fail with "permission denied" (42501) before row level security is consulted.
-- Older projects got every privilege by default, including TRUNCATE, which ignores row level
-- security; the app needs only these four, so the rest are revoked. Anon keeps no access.

revoke all on
  public.attempts, public.lesson_progress, public.review_states, public.topic_mastery,
  public.note_folders, public.notes, public.code_projects, public.code_versions,
  public.custom_exercises, public.submissions, public.bookmarks, public.certification_progress,
  public.activity_days, public.settings,
  public.semesters, public.timetable_classes, public.important_dates
from authenticated;

grant select, insert, update, delete on
  public.attempts, public.lesson_progress, public.review_states, public.topic_mastery,
  public.note_folders, public.notes, public.code_projects, public.code_versions,
  public.custom_exercises, public.submissions, public.bookmarks, public.certification_progress,
  public.activity_days, public.settings,
  public.semesters, public.timetable_classes, public.important_dates
to authenticated;

-- profiles keeps the narrow grants of its own migration (select, and update of display_name).
revoke truncate, references, trigger on public.profiles from authenticated;
