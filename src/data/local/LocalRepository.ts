/** StudyRepository backed by the browser's IndexedDB: private to this browser profile, works offline. */
import type { ActivityDayRecord, ActivityDelta, BackupFile, DayKey, ExamDraftRecord, Settings } from '../records';
import { DEFAULT_SETTINGS } from '../records';
import type { AttemptQuery, ImportMode, StudyRepository } from '../repository';
import { openStudyDatabase, type StudyDatabase, TABLES } from './database';

const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export class LocalRepository implements StudyRepository {
  readonly backend = 'local' as const;
  private readonly db: StudyDatabase;

  constructor(databaseName?: string) {
    this.db = openStudyDatabase(databaseName);
  }

  async addAttempt(attempt: Parameters<StudyRepository['addAttempt']>[0]) {
    await this.db.attempts.add(attempt);
  }

  async replaceAttempt(attempt: Parameters<StudyRepository['replaceAttempt']>[0]) {
    await this.db.attempts.put(attempt);
  }

  async listAttempts(query: AttemptQuery = {}) {
    let collection = query.questionId
      ? this.db.attempts.where('questionId').equals(query.questionId)
      : query.courseId
        ? this.db.attempts.where('courseId').equals(query.courseId)
        : this.db.attempts.toCollection();
    if (query.since) {
      const since = query.since;
      collection = collection.filter((attempt) => attempt.createdAt >= since);
    }
    const attempts = (await collection.toArray()).sort(byNewest);
    return query.limit ? attempts.slice(0, query.limit) : attempts;
  }

  getLessonProgress(lessonId: string) {
    return this.db.lessonProgress.get(lessonId);
  }

  listLessonProgress(courseId?: string) {
    return courseId ? this.db.lessonProgress.where('courseId').equals(courseId).toArray() : this.db.lessonProgress.toArray();
  }

  async saveLessonProgress(record: Parameters<StudyRepository['saveLessonProgress']>[0]) {
    await this.db.lessonProgress.put(record);
  }

  getReviewState(itemId: string) {
    return this.db.reviewStates.get(itemId);
  }

  listReviewStates() {
    return this.db.reviewStates.toArray();
  }

  async saveReviewState(record: Parameters<StudyRepository['saveReviewState']>[0]) {
    await this.db.reviewStates.put(record);
  }

  listTopicMastery() {
    return this.db.topicMastery.toArray();
  }

  async saveTopicMastery(records: Parameters<StudyRepository['saveTopicMastery']>[0]) {
    await this.db.topicMastery.bulkPut(records);
  }

  listSemesters() {
    return this.db.semesters.toArray();
  }

  async saveSemester(record: Parameters<StudyRepository['saveSemester']>[0]) {
    await this.db.semesters.put(record);
  }

  listTimetableClasses() {
    return this.db.timetableClasses.toArray();
  }

  async saveTimetableClass(record: Parameters<StudyRepository['saveTimetableClass']>[0]) {
    await this.db.timetableClasses.put(record);
  }

  async deleteTimetableClass(id: string) {
    await this.db.timetableClasses.delete(id);
  }

  listImportantDates() {
    return this.db.importantDates.toArray();
  }

  async saveImportantDate(record: Parameters<StudyRepository['saveImportantDate']>[0]) {
    await this.db.importantDates.put(record);
  }

  async deleteImportantDate(id: string) {
    await this.db.importantDates.delete(id);
  }

  async listLegacyNotes() {
    const notes = await this.db.notes.toArray();
    return notes.map(({ id, title, body, updatedAt }) => ({ id, title, body, updatedAt })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async deleteLegacyNotes() {
    await this.db.transaction('rw', this.db.notes, this.db.noteFolders, async () => {
      await this.db.notes.clear();
      await this.db.noteFolders.clear();
    });
  }

  listCodeProjects() {
    return this.db.codeProjects.toArray();
  }

  getCodeProject(id: string) {
    return this.db.codeProjects.get(id);
  }

  async saveCodeProject(record: Parameters<StudyRepository['saveCodeProject']>[0]) {
    await this.db.codeProjects.put(record);
  }

  async deleteCodeProject(id: string) {
    await this.db.transaction('rw', this.db.codeProjects, this.db.codeVersions, async () => {
      await this.db.codeVersions.where('projectId').equals(id).delete();
      await this.db.codeProjects.delete(id);
    });
  }

  async listCodeVersions(projectId: string) {
    return (await this.db.codeVersions.where('projectId').equals(projectId).toArray()).sort(byNewest);
  }

  async saveCodeVersion(record: Parameters<StudyRepository['saveCodeVersion']>[0]) {
    await this.db.codeVersions.put(record);
  }

  listCustomExercises() {
    return this.db.customExercises.toArray();
  }

  getCustomExercise(id: string) {
    return this.db.customExercises.get(id);
  }

  async saveCustomExercise(record: Parameters<StudyRepository['saveCustomExercise']>[0]) {
    await this.db.customExercises.put(record);
  }

  async deleteCustomExercise(id: string) {
    await this.db.transaction('rw', this.db.customExercises, this.db.submissions, async () => {
      await this.db.submissions.where('exerciseId').equals(id).delete();
      await this.db.customExercises.delete(id);
    });
  }

  async listSubmissions(exerciseId?: string) {
    const rows = exerciseId ? await this.db.submissions.where('exerciseId').equals(exerciseId).toArray() : await this.db.submissions.toArray();
    return rows.sort(byNewest);
  }

  async addSubmission(record: Parameters<StudyRepository['addSubmission']>[0]) {
    await this.db.submissions.add(record);
  }

  listBookmarks() {
    return this.db.bookmarks.toArray();
  }

  async saveBookmark(record: Parameters<StudyRepository['saveBookmark']>[0]) {
    await this.db.bookmarks.put(record);
  }

  async deleteBookmark(key: string) {
    await this.db.bookmarks.delete(key);
  }

  listCertificationProgress() {
    return this.db.certificationProgress.toArray();
  }

  async saveCertificationProgress(record: Parameters<StudyRepository['saveCertificationProgress']>[0]) {
    await this.db.certificationProgress.put(record);
  }

  async deleteCertificationProgress(certId: string) {
    await this.db.certificationProgress.delete(certId);
  }

  async listActivityDays(sinceDay?: DayKey) {
    const days = sinceDay ? await this.db.activityDays.where('day').aboveOrEqual(sinceDay).toArray() : await this.db.activityDays.toArray();
    return days.sort((a, b) => a.day.localeCompare(b.day));
  }

  async recordActivity(day: DayKey, delta: ActivityDelta) {
    await this.db.transaction('rw', this.db.activityDays, async () => {
      const current = (await this.db.activityDays.get(day)) ?? emptyDay(day);
      await this.db.activityDays.put(addActivity(current, delta));
    });
  }

  async getSettings(): Promise<Settings> {
    const row = await this.db.settings.get('settings');
    return { ...DEFAULT_SETTINGS, ...row?.value };
  }

  async saveSettings(settings: Settings) {
    await this.db.settings.put({ key: 'settings', value: settings });
  }

  getExamDraft(id: string) {
    return this.db.examDrafts.get(id);
  }

  async saveExamDraft(record: ExamDraftRecord) {
    await this.db.examDrafts.put(record);
  }

  async deleteExamDraft(id: string) {
    await this.db.examDrafts.delete(id);
  }

  async isEmpty() {
    const counts = await Promise.all(TABLES.filter((table) => table !== 'settings').map((table) => this.db.table(table).count()));
    return counts.every((count) => count === 0);
  }

  async exportAll(): Promise<BackupFile> {
    const [attempts, lessonProgress, reviewStates, topicMastery, codeProjects, codeVersions, customExercises, submissions, bookmarks, certificationProgress, activityDays, semesters, timetableClasses, importantDates, examDrafts, settings] =
      await Promise.all([
        this.db.attempts.toArray(),
        this.db.lessonProgress.toArray(),
        this.db.reviewStates.toArray(),
        this.db.topicMastery.toArray(),
        this.db.codeProjects.toArray(),
        this.db.codeVersions.toArray(),
        this.db.customExercises.toArray(),
        this.db.submissions.toArray(),
        this.db.bookmarks.toArray(),
        this.db.certificationProgress.toArray(),
        this.db.activityDays.toArray(),
        this.db.semesters.toArray(),
        this.db.timetableClasses.toArray(),
        this.db.importantDates.toArray(),
        this.db.examDrafts.toArray(),
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

  async importAll(backup: BackupFile, mode: ImportMode) {
    await this.db.transaction('rw', TABLES.map((table) => this.db.table(table)), async () => {
      if (mode === 'replace') await Promise.all(TABLES.map((table) => this.db.table(table).clear()));
      await this.db.attempts.bulkPut(backup.attempts);
      await this.db.lessonProgress.bulkPut(backup.lessonProgress);
      await this.db.reviewStates.bulkPut(backup.reviewStates);
      await this.db.topicMastery.bulkPut(backup.topicMastery);
      await this.db.codeProjects.bulkPut(backup.codeProjects);
      await this.db.codeVersions.bulkPut(backup.codeVersions);
      await this.db.customExercises.bulkPut(backup.customExercises);
      await this.db.submissions.bulkPut(backup.submissions);
      await this.db.bookmarks.bulkPut(backup.bookmarks);
      await this.db.certificationProgress.bulkPut(backup.certificationProgress);
      await this.db.activityDays.bulkPut(backup.activityDays);
      await this.db.semesters.bulkPut(backup.semesters);
      await this.db.timetableClasses.bulkPut(backup.timetableClasses);
      await this.db.importantDates.bulkPut(backup.importantDates);
      await this.db.examDrafts.bulkPut(backup.examDrafts);
      await this.db.settings.put({ key: 'settings', value: { ...DEFAULT_SETTINGS, ...backup.settings } });
    });
  }

  /** Close the connection (tests). */
  close() {
    this.db.close();
  }
}

export function emptyDay(day: DayKey): ActivityDayRecord {
  return { day, minutes: 0, attempts: 0, correct: 0, lessonsCompleted: 0, codeRuns: 0, updatedAt: new Date().toISOString() };
}

export function addActivity(current: ActivityDayRecord, delta: ActivityDelta): ActivityDayRecord {
  return {
    ...current,
    minutes: current.minutes + (delta.minutes ?? 0),
    attempts: current.attempts + (delta.attempts ?? 0),
    correct: current.correct + (delta.correct ?? 0),
    lessonsCompleted: current.lessonsCompleted + (delta.lessonsCompleted ?? 0),
    codeRuns: current.codeRuns + (delta.codeRuns ?? 0),
    updatedAt: new Date().toISOString(),
  };
}
