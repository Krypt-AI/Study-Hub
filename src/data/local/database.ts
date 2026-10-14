import Dexie, { type EntityTable } from 'dexie';
import type {
  ActivityDayRecord,
  AttemptRecord,
  BookmarkRecord,
  CertificationProgressRecord,
  CodeProjectRecord,
  CodeVersionRecord,
  CustomExerciseRecord,
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
import { normalizeClassKind } from '../records';

export interface SettingsRow {
  key: 'settings';
  value: Settings;
}

export type StudyDatabase = Dexie & {
  attempts: EntityTable<AttemptRecord, 'id'>;
  lessonProgress: EntityTable<LessonProgressRecord, 'lessonId'>;
  reviewStates: EntityTable<ReviewStateRecord, 'itemId'>;
  topicMastery: EntityTable<TopicMasteryRecord, 'key'>;
  /** Left by the removed notebook (version 1); read only to let the learner download them. */
  noteFolders: EntityTable<{ id: string }, 'id'>;
  notes: EntityTable<LegacyNote, 'id'>;
  codeProjects: EntityTable<CodeProjectRecord, 'id'>;
  codeVersions: EntityTable<CodeVersionRecord, 'id'>;
  customExercises: EntityTable<CustomExerciseRecord, 'id'>;
  submissions: EntityTable<SubmissionRecord, 'id'>;
  bookmarks: EntityTable<BookmarkRecord, 'key'>;
  certificationProgress: EntityTable<CertificationProgressRecord, 'certId'>;
  activityDays: EntityTable<ActivityDayRecord, 'day'>;
  semesters: EntityTable<SemesterRecord, 'term'>;
  timetableClasses: EntityTable<TimetableClassRecord, 'id'>;
  importantDates: EntityTable<ImportantDateRecord, 'id'>;
  examDrafts: EntityTable<ExamDraftRecord, 'id'>;
  settings: EntityTable<SettingsRow, 'key'>;
};

export function openStudyDatabase(name = 'study-hub'): StudyDatabase {
  const database = new Dexie(name) as StudyDatabase;
  // Primary key first, then indexes. "*" marks multi-entry (array) indexes.
  database.version(1).stores({
    attempts: 'id, questionId, courseId, createdAt',
    lessonProgress: 'lessonId, courseId, updatedAt',
    reviewStates: 'itemId, due, courseId',
    topicMastery: 'key, topicId',
    noteFolders: 'id, parentId',
    notes: 'id, folderId, updatedAt, *linkKeys',
    codeProjects: 'id, updatedAt, *linkKeys',
    codeVersions: 'id, projectId, createdAt',
    customExercises: 'id, updatedAt',
    submissions: 'id, exerciseId, createdAt',
    bookmarks: 'key, type, createdAt',
    certificationProgress: 'certId',
    activityDays: 'day',
    settings: 'key',
  });
  // The notebook's tables stay so that existing notes are not lost without the learner's say.
  database.version(2).stores({
    semesters: 'term',
    timetableClasses: 'id, term',
    importantDates: 'id, date',
  });
  database.version(3).stores({ examDrafts: 'id' });
  // Tutorials and "other" classes became lectures when only Lecture and Lab remained.
  database.version(4).upgrade((transaction) =>
    transaction
      .table<TimetableClassRecord>('timetableClasses')
      .toCollection()
      .modify((record) => {
        record.kind = normalizeClassKind(record.kind);
      }),
  );
  return database;
}

/** Tables holding the learner's current data (backups, replace-import). */
export const TABLES = [
  'attempts',
  'lessonProgress',
  'reviewStates',
  'topicMastery',
  'codeProjects',
  'codeVersions',
  'customExercises',
  'submissions',
  'bookmarks',
  'certificationProgress',
  'activityDays',
  'semesters',
  'timetableClasses',
  'importantDates',
  'examDrafts',
  'settings',
] as const;
