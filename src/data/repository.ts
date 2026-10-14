/**
 * Storage contract for everything a learner owns. The app only talks to this
 * interface; `LocalRepository` (IndexedDB) and `SupabaseRepository` implement it.
 * Methods named `save*` are upserts keyed by the record's id.
 */
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
  Timestamp,
  TopicMasteryRecord,
} from './records';

export interface AttemptQuery {
  questionId?: string;
  courseId?: string;
  since?: Timestamp;
  /** Newest first; defaults to all matching attempts. */
  limit?: number;
}

export type ImportMode = 'merge' | 'replace';

export interface StudyRepository {
  readonly backend: 'local' | 'supabase';

  addAttempt(attempt: AttemptRecord): Promise<void>;
  /** Overwrites a recorded attempt with the same id, e.g. after the learner re-marks it. */
  replaceAttempt(attempt: AttemptRecord): Promise<void>;
  /** Newest first. */
  listAttempts(query?: AttemptQuery): Promise<AttemptRecord[]>;

  getLessonProgress(lessonId: string): Promise<LessonProgressRecord | undefined>;
  listLessonProgress(courseId?: string): Promise<LessonProgressRecord[]>;
  saveLessonProgress(record: LessonProgressRecord): Promise<void>;

  getReviewState(itemId: string): Promise<ReviewStateRecord | undefined>;
  listReviewStates(): Promise<ReviewStateRecord[]>;
  saveReviewState(record: ReviewStateRecord): Promise<void>;

  listTopicMastery(): Promise<TopicMasteryRecord[]>;
  saveTopicMastery(records: TopicMasteryRecord[]): Promise<void>;

  listSemesters(): Promise<SemesterRecord[]>;
  saveSemester(record: SemesterRecord): Promise<void>;
  listTimetableClasses(): Promise<TimetableClassRecord[]>;
  saveTimetableClass(record: TimetableClassRecord): Promise<void>;
  deleteTimetableClass(id: string): Promise<void>;
  listImportantDates(): Promise<ImportantDateRecord[]>;
  saveImportantDate(record: ImportantDateRecord): Promise<void>;
  deleteImportantDate(id: string): Promise<void>;

  /** Notes written before the notebook was removed, newest first; empty once deleted. */
  listLegacyNotes(): Promise<LegacyNote[]>;
  deleteLegacyNotes(): Promise<void>;

  listCodeProjects(): Promise<CodeProjectRecord[]>;
  getCodeProject(id: string): Promise<CodeProjectRecord | undefined>;
  saveCodeProject(record: CodeProjectRecord): Promise<void>;
  /** Deletes the project and its saved versions. */
  deleteCodeProject(id: string): Promise<void>;
  /** Newest first. */
  listCodeVersions(projectId: string): Promise<CodeVersionRecord[]>;
  saveCodeVersion(record: CodeVersionRecord): Promise<void>;

  listCustomExercises(): Promise<CustomExerciseRecord[]>;
  getCustomExercise(id: string): Promise<CustomExerciseRecord | undefined>;
  saveCustomExercise(record: CustomExerciseRecord): Promise<void>;
  /** Deletes the exercise and its submissions. */
  deleteCustomExercise(id: string): Promise<void>;
  /** Newest first. */
  listSubmissions(exerciseId?: string): Promise<SubmissionRecord[]>;
  addSubmission(record: SubmissionRecord): Promise<void>;

  listBookmarks(): Promise<BookmarkRecord[]>;
  saveBookmark(record: BookmarkRecord): Promise<void>;
  deleteBookmark(key: string): Promise<void>;

  listCertificationProgress(): Promise<CertificationProgressRecord[]>;
  saveCertificationProgress(record: CertificationProgressRecord): Promise<void>;
  deleteCertificationProgress(certId: string): Promise<void>;

  /** Oldest first. */
  listActivityDays(sinceDay?: DayKey): Promise<ActivityDayRecord[]>;
  /** Adds the delta to the day's counters, creating the day if needed. */
  recordActivity(day: DayKey, delta: ActivityDelta): Promise<void>;

  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  getExamDraft(id: string): Promise<ExamDraftRecord | undefined>;
  saveExamDraft(record: ExamDraftRecord): Promise<void>;
  deleteExamDraft(id: string): Promise<void>;

  /** True when the learner has no saved progress, calendar, code or saved items (settings do not count). */
  isEmpty(): Promise<boolean>;

  exportAll(): Promise<BackupFile>;
  importAll(backup: BackupFile, mode: ImportMode): Promise<void>;
}
