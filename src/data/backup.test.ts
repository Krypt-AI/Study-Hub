import { describe, expect, it } from 'vitest';
import { parseBackup } from './backup';
import { LocalRepository } from './local/LocalRepository';
import type { TimetableClassRecord } from './records';

describe('backups', () => {
  it('round-trips everything a learner owns through export and import', async () => {
    const source = new LocalRepository('backup-source');
    await source.saveSemester({ term: 'Sem 1 2026', startsOn: '2026-10-05', endsOn: '2027-01-29', updatedAt: 'a' });
    await source.saveTimetableClass({ id: 'c1', term: 'Sem 1 2026', title: 'CMPD333 lecture', kind: 'lecture', weekday: 2, start: '08:00', end: '10:00', createdAt: 'a', updatedAt: 'a' });
    await source.saveImportantDate({ id: 'd1', title: 'CMPD363 midterm', kind: 'midterm', date: '2026-11-18', createdAt: 'a', updatedAt: 'a' });
    await source.recordActivity('2026-10-11', { minutes: 3 });
    await source.saveSettings({ dailyGoalMinutes: 45, dailyGoalQuestions: 10, reviewSessionSize: 25, desiredRetention: 0.85 });
    await source.saveExamDraft({ id: 'jlpt-n5/mock', courseId: 'jlpt-n5', assessmentId: 'mock', sectionIndex: 1, startedAt: 1, timesMs: [600], timed: true, answers: { q1: { type: 'choice', selected: ['a'] } }, updatedAt: 'a' });

    const backup = parseBackup(JSON.stringify(await source.exportAll()));
    const target = new LocalRepository('backup-target');
    await target.importAll(backup, 'replace');

    expect((await target.listSemesters()).map((semester) => semester.startsOn)).toEqual(['2026-10-05']);
    expect((await target.listTimetableClasses()).map((entry) => entry.title)).toEqual(['CMPD333 lecture']);
    expect((await target.listImportantDates()).map((entry) => entry.kind)).toEqual(['midterm']);
    expect((await target.listActivityDays()).map((day) => day.minutes)).toEqual([3]);
    expect((await target.getSettings()).dailyGoalMinutes).toBe(45);
    expect((await target.getExamDraft('jlpt-n5/mock'))?.sectionIndex).toBe(1);
    source.close();
    target.close();
  });

  const empty = { attempts: [], lessonProgress: [], reviewStates: [], topicMastery: [], codeProjects: [], codeVersions: [], customExercises: [], submissions: [], bookmarks: [], certificationProgress: [], activityDays: [], settings: {} };

  it('imports version 1 backups, which have no calendar and no exam sittings', () => {
    const backup = parseBackup(JSON.stringify({ format: 'study-hub-backup', version: 1, exportedAt: 'a', ...empty, noteFolders: [], notes: [{ id: 'n1' }] }));
    expect(backup.version).toBe(3);
    expect(backup.importantDates).toEqual([]);
    expect(backup.examDrafts).toEqual([]);
  });

  it('reads classes saved as tutorials or "other" as lectures, from storage and from backups', async () => {
    const legacy = (id: string, kind: string) => ({ id, term: 'Sem 1 2026', title: id, kind, weekday: 1, start: '08:00', end: '10:00', createdAt: 'a', updatedAt: 'a' }) as unknown as TimetableClassRecord;
    const repository = new LocalRepository('class-kinds');
    await repository.saveTimetableClass(legacy('t', 'tutorial'));
    await repository.saveTimetableClass(legacy('l', 'lab'));
    expect((await repository.listTimetableClasses()).map((entry) => [entry.id, entry.kind])).toEqual([['l', 'lab'], ['t', 'lecture']]);
    repository.close();

    const backup = parseBackup(JSON.stringify({ format: 'study-hub-backup', version: 2, exportedAt: 'a', ...empty, semesters: [], timetableClasses: [legacy('o', 'other')], importantDates: [] }));
    expect(backup.timetableClasses.map((entry) => entry.kind)).toEqual(['lecture']);
  });

  it('imports version 2 backups, keeping their calendar', () => {
    const date = { id: 'd1', title: 'Quiz', kind: 'quiz', date: '2026-11-02', createdAt: 'a', updatedAt: 'a' };
    const backup = parseBackup(JSON.stringify({ format: 'study-hub-backup', version: 2, exportedAt: 'a', ...empty, semesters: [], timetableClasses: [], importantDates: [date] }));
    expect(backup.version).toBe(3);
    expect(backup.importantDates).toEqual([date]);
    expect(backup.examDrafts).toEqual([]);
  });

  it('rejects files that are not Study Hub backups', () => {
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/u);
    expect(() => parseBackup('{"format":"other"}')).toThrow(/not a Study Hub backup/u);
  });
});
