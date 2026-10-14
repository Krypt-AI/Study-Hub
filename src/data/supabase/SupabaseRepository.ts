/**
 * StudyRepository backed by Supabase Postgres (schema: supabase/migrations). Each row holds
 * the app's record as JSONB; row level security limits every query to the signed-in
 * account, and user_id is filled in by the database, so this class never sends one.
 * One instance serves one of the account's learners: every query is filtered by learner_id.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ActivityDayRecord,
  ActivityDelta,
  AttemptRecord,
  BackupFile,
  BookmarkRecord,
  CertificationProgressRecord,
  CodeProjectRecord,
  CodeVersionRecord,
  CustomExerciseRecord,
  DayKey,
  ExamDraftRecord,
  ImportantDateRecord,
  LegacyNote,
  LessonProgressRecord,
  ReviewStateRecord,
  SemesterRecord,
  Settings,
  SubmissionRecord,
  TimetableClassRecord,
  TopicMasteryRecord,
} from '../records';
import { DEFAULT_SETTINGS, normalizeTimetableClass } from '../records';
import { MAIN_LEARNER_ID } from '../learners/learners';
import type { AttemptQuery, ImportMode, StudyRepository } from '../repository';

/** Table for each record type, with the record field that is its key. */
const TABLES = {
  attempts: 'id',
  lesson_progress: 'lessonId',
  review_states: 'itemId',
  topic_mastery: 'key',
  code_projects: 'id',
  code_versions: 'id',
  custom_exercises: 'id',
  submissions: 'id',
  bookmarks: 'key',
  certification_progress: 'certId',
  activity_days: 'day',
  semesters: 'term',
  timetable_classes: 'id',
  important_dates: 'id',
  exam_drafts: 'id',
} as const;

/** Left by the removed notebook: account-wide (they predate learners), read only to let the main learner download them. */
const LEGACY_NOTE_TABLES = ['notes', 'note_folders'] as const;

type Table = keyof typeof TABLES | 'settings';
/** The records of one learner in a table. */
const learnerRows = (client: SupabaseClient, table: string, learnerId: string) => client.from(table).select('record').eq('learner_id', learnerId);
type Query = ReturnType<typeof learnerRows>;

/** PostgREST returns at most 1000 rows per request; larger reads are paged. */
const PAGE_SIZE = 1000;
/** Rows per upsert request when importing. */
const WRITE_BATCH = 500;

export class SupabaseRepository implements StudyRepository {
  readonly backend = 'supabase' as const;

  constructor(
    private readonly client: SupabaseClient,
    private readonly learnerId: string,
  ) {}

  // Generic access ---------------------------------------------------------------------

  private async select<T>(table: Table, refine: (query: Query) => Query = (query) => query.order('id'), limit?: number): Promise<T[]> {
    const records: T[] = [];
    for (let from = 0; limit === undefined || from < limit; from += PAGE_SIZE) {
      const to = (limit === undefined ? from + PAGE_SIZE : Math.min(from + PAGE_SIZE, limit)) - 1;
      const { data, error } = await refine(learnerRows(this.client, table, this.learnerId)).range(from, to);
      if (error) throw failure(table, error);
      const rows = (data ?? []) as Array<{ record: T }>;
      records.push(...rows.map((row) => row.record));
      if (rows.length < to - from + 1) break;
    }
    return records;
  }

  private async get<T>(table: Table, id: string): Promise<T | undefined> {
    const { data, error } = await learnerRows(this.client, table, this.learnerId).eq('id', id).maybeSingle();
    if (error) throw failure(table, error);
    return (data as { record: T } | null)?.record;
  }

  private async put(table: keyof typeof TABLES, records: object[]): Promise<void> {
    const key = TABLES[table];
    for (let start = 0; start < records.length; start += WRITE_BATCH) {
      const rows = records.slice(start, start + WRITE_BATCH).map((record) => ({ learner_id: this.learnerId, id: String((record as Record<string, unknown>)[key]), record }));
      const { error } = await this.client.from(table).upsert(rows, { onConflict: 'user_id,learner_id,id' });
      if (error) throw failure(table, error);
    }
  }

  private async remove(table: Table, column: string, value: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq('learner_id', this.learnerId).eq(column, value);
    if (error) throw failure(table, error);
  }

  private async rpc(name: string, args: Record<string, unknown>): Promise<void> {
    const { error } = await this.client.rpc(name, args);
    if (error) throw failure(name, error);
  }

  // StudyRepository ----------------------------------------------------------------------

  async addAttempt(attempt: AttemptRecord) {
    await this.put('attempts', [attempt]);
  }

  async replaceAttempt(attempt: AttemptRecord) {
    await this.put('attempts', [attempt]);
  }

  listAttempts(query: AttemptQuery = {}) {
    return this.select<AttemptRecord>(
      'attempts',
      (builder) => {
        let filtered = builder;
        if (query.questionId) filtered = filtered.eq('question_id', query.questionId);
        if (query.courseId) filtered = filtered.eq('course_id', query.courseId);
        if (query.since) filtered = filtered.gte('created_at', query.since);
        return filtered.order('created_at', { ascending: false }).order('id');
      },
      query.limit,
    );
  }

  getLessonProgress(lessonId: string) {
    return this.get<LessonProgressRecord>('lesson_progress', lessonId);
  }

  listLessonProgress(courseId?: string) {
    return this.select<LessonProgressRecord>('lesson_progress', (query) => (courseId ? query.eq('course_id', courseId) : query).order('id'));
  }

  async saveLessonProgress(record: LessonProgressRecord) {
    await this.put('lesson_progress', [record]);
  }

  getReviewState(itemId: string) {
    return this.get<ReviewStateRecord>('review_states', itemId);
  }

  listReviewStates() {
    return this.select<ReviewStateRecord>('review_states');
  }

  async saveReviewState(record: ReviewStateRecord) {
    await this.put('review_states', [record]);
  }

  listTopicMastery() {
    return this.select<TopicMasteryRecord>('topic_mastery');
  }

  async saveTopicMastery(records: TopicMasteryRecord[]) {
    await this.put('topic_mastery', records);
  }

  listSemesters() {
    return this.select<SemesterRecord>('semesters');
  }

  async saveSemester(record: SemesterRecord) {
    await this.put('semesters', [record]);
  }

  async deleteSemester(term: string) {
    await this.remove('semesters', 'id', term);
  }

  async listTimetableClasses() {
    return (await this.select<TimetableClassRecord>('timetable_classes')).map(normalizeTimetableClass);
  }

  async saveTimetableClass(record: TimetableClassRecord) {
    await this.put('timetable_classes', [record]);
  }

  async deleteTimetableClass(id: string) {
    await this.remove('timetable_classes', 'id', id);
  }

  listImportantDates() {
    return this.select<ImportantDateRecord>('important_dates');
  }

  async saveImportantDate(record: ImportantDateRecord) {
    await this.put('important_dates', [record]);
  }

  async deleteImportantDate(id: string) {
    await this.remove('important_dates', 'id', id);
  }

  async listLegacyNotes() {
    if (this.learnerId !== MAIN_LEARNER_ID) return [];
    const { data, error } = await this.client.from('notes').select('record').order('id');
    if (error) throw failure('notes', error);
    const notes = ((data ?? []) as Array<{ record: LegacyNote }>).map((row) => row.record);
    return notes.map(({ id, title, body, updatedAt }) => ({ id, title, body, updatedAt })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async deleteLegacyNotes() {
    if (this.learnerId !== MAIN_LEARNER_ID) return;
    for (const table of LEGACY_NOTE_TABLES) {
      const { error } = await this.client.from(table).delete().neq('id', '');
      if (error) throw failure(table, error);
    }
  }

  listCodeProjects() {
    return this.select<CodeProjectRecord>('code_projects');
  }

  getCodeProject(id: string) {
    return this.get<CodeProjectRecord>('code_projects', id);
  }

  async saveCodeProject(record: CodeProjectRecord) {
    await this.put('code_projects', [record]);
  }

  async deleteCodeProject(id: string) {
    // Versions first: if the second request fails, the project is still there to retry.
    await this.remove('code_versions', 'project_id', id);
    await this.remove('code_projects', 'id', id);
  }

  listCodeVersions(projectId: string) {
    return this.select<CodeVersionRecord>('code_versions', (query) =>
      query.eq('project_id', projectId).order('created_at', { ascending: false }).order('id'),
    );
  }

  async saveCodeVersion(record: CodeVersionRecord) {
    await this.put('code_versions', [record]);
  }

  listCustomExercises() {
    return this.select<CustomExerciseRecord>('custom_exercises');
  }

  getCustomExercise(id: string) {
    return this.get<CustomExerciseRecord>('custom_exercises', id);
  }

  async saveCustomExercise(record: CustomExerciseRecord) {
    await this.put('custom_exercises', [record]);
  }

  async deleteCustomExercise(id: string) {
    await this.remove('submissions', 'exercise_id', id);
    await this.remove('custom_exercises', 'id', id);
  }

  listSubmissions(exerciseId?: string) {
    return this.select<SubmissionRecord>('submissions', (query) =>
      (exerciseId ? query.eq('exercise_id', exerciseId) : query).order('created_at', { ascending: false }).order('id'),
    );
  }

  async addSubmission(record: SubmissionRecord) {
    await this.put('submissions', [record]);
  }

  listBookmarks() {
    return this.select<BookmarkRecord>('bookmarks');
  }

  async saveBookmark(record: BookmarkRecord) {
    await this.put('bookmarks', [record]);
  }

  async deleteBookmark(key: string) {
    await this.remove('bookmarks', 'id', key);
  }

  listCertificationProgress() {
    return this.select<CertificationProgressRecord>('certification_progress');
  }

  async saveCertificationProgress(record: CertificationProgressRecord) {
    await this.put('certification_progress', [record]);
  }

  async deleteCertificationProgress(certId: string) {
    await this.remove('certification_progress', 'id', certId);
  }

  listActivityDays(sinceDay?: DayKey) {
    return this.select<ActivityDayRecord>('activity_days', (query) => (sinceDay ? query.gte('id', sinceDay) : query).order('id'));
  }

  async recordActivity(day: DayKey, delta: ActivityDelta) {
    await this.rpc('record_activity', { p_learner: this.learnerId, p_day: day, p_delta: delta });
  }

  async getSettings(): Promise<Settings> {
    return { ...DEFAULT_SETTINGS, ...(await this.get<Partial<Settings>>('settings', 'settings')) };
  }

  async saveSettings(settings: Settings) {
    const { error } = await this.client.from('settings').upsert({ learner_id: this.learnerId, id: 'settings', record: settings }, { onConflict: 'user_id,learner_id,id' });
    if (error) throw failure('settings', error);
  }

  getExamDraft(id: string) {
    return this.get<ExamDraftRecord>('exam_drafts', id);
  }

  async saveExamDraft(record: ExamDraftRecord) {
    await this.put('exam_drafts', [record]);
  }

  async deleteExamDraft(id: string) {
    await this.remove('exam_drafts', 'id', id);
  }

  async isEmpty() {
    for (const table of Object.keys(TABLES) as Array<keyof typeof TABLES>) {
      const { count, error } = await this.client.from(table).select('id', { count: 'exact', head: true }).eq('learner_id', this.learnerId);
      if (error) throw failure(table, error);
      if (count) return false;
    }
    return true;
  }

  async exportAll(): Promise<BackupFile> {
    const [attempts, lessonProgress, reviewStates, topicMastery, codeProjects, codeVersions, customExercises, submissions, bookmarks, certificationProgress, activityDays, semesters, timetableClasses, importantDates, examDrafts, settings] =
      await Promise.all([
        this.listAttempts(),
        this.listLessonProgress(),
        this.listReviewStates(),
        this.listTopicMastery(),
        this.listCodeProjects(),
        this.select<CodeVersionRecord>('code_versions'),
        this.listCustomExercises(),
        this.listSubmissions(),
        this.listBookmarks(),
        this.listCertificationProgress(),
        this.listActivityDays(),
        this.listSemesters(),
        this.listTimetableClasses(),
        this.listImportantDates(),
        this.select<ExamDraftRecord>('exam_drafts'),
        this.getSettings(),
      ]);
    return {
      format: 'study-hub-backup',
      version: 3,
      exportedAt: new Date().toISOString(),
      attempts,
      lessonProgress,
      reviewStates,
      topicMastery,
      codeProjects,
      codeVersions,
      customExercises,
      submissions,
      bookmarks,
      certificationProgress,
      activityDays,
      semesters,
      timetableClasses,
      importantDates,
      examDrafts,
      settings,
    };
  }

  /** Not atomic across tables: a failed import can be repeated, since every write is an upsert. */
  async importAll(backup: BackupFile, mode: ImportMode) {
    if (mode === 'replace') {
      for (const table of [...Object.keys(TABLES), 'settings'] as Table[]) {
        const { error } = await this.client.from(table).delete().eq('learner_id', this.learnerId);
        if (error) throw failure(table, error);
      }
    }
    await this.put('attempts', backup.attempts);
    await this.put('lesson_progress', backup.lessonProgress);
    await this.put('review_states', backup.reviewStates);
    await this.put('topic_mastery', backup.topicMastery);
    await this.put('code_projects', backup.codeProjects);
    await this.put('code_versions', backup.codeVersions);
    await this.put('custom_exercises', backup.customExercises);
    await this.put('submissions', backup.submissions);
    await this.put('bookmarks', backup.bookmarks);
    await this.put('certification_progress', backup.certificationProgress);
    await this.put('activity_days', backup.activityDays);
    await this.put('semesters', backup.semesters);
    await this.put('timetable_classes', backup.timetableClasses);
    await this.put('important_dates', backup.importantDates);
    await this.put('exam_drafts', backup.examDrafts);
    await this.saveSettings({ ...DEFAULT_SETTINGS, ...backup.settings });
  }
}

function failure(source: string, error: { message: string; code?: string }): Error {
  return new Error(`Supabase request failed (${source}): ${error.message}${error.code ? ` [${error.code}]` : ''}`);
}
