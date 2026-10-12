import { describe, expect, it } from 'vitest';
import { parseBackup } from './backup';
import { LocalRepository } from './local/LocalRepository';

describe('backups', () => {
  it('round-trips everything a learner owns through export and import', async () => {
    const source = new LocalRepository('backup-source');
    await source.saveSemester({ term: 'Sem 1 2026', startsOn: '2026-10-05', endsOn: '2027-01-29', updatedAt: 'a' });
    await source.saveTimetableClass({ id: 'c1', term: 'Sem 1 2026', title: 'CMPD333 lecture', kind: 'lecture', weekday: 2, start: '08:00', end: '10:00', createdAt: 'a', updatedAt: 'a' });
    await source.saveImportantDate({ id: 'd1', title: 'CMPD363 midterm', kind: 'midterm', date: '2026-11-18', createdAt: 'a', updatedAt: 'a' });
    await source.recordActivity('2026-10-11', { minutes: 3 });
    await source.saveSettings({ dailyGoalMinutes: 45, dailyGoalQuestions: 10, reviewSessionSize: 25, desiredRetention: 0.85 });

    const backup = parseBackup(JSON.stringify(await source.exportAll()));
    const target = new LocalRepository('backup-target');
    await target.importAll(backup, 'replace');

    expect((await target.listSemesters()).map((semester) => semester.startsOn)).toEqual(['2026-10-05']);
    expect((await target.listTimetableClasses()).map((entry) => entry.title)).toEqual(['CMPD333 lecture']);
    expect((await target.listImportantDates()).map((entry) => entry.kind)).toEqual(['midterm']);
    expect((await target.listActivityDays()).map((day) => day.minutes)).toEqual([3]);
    expect((await target.getSettings()).dailyGoalMinutes).toBe(45);
    source.close();
    target.close();
  });

  it('imports version 1 backups, which have no calendar', () => {
    const empty = { attempts: [], lessonProgress: [], reviewStates: [], topicMastery: [], noteFolders: [], notes: [{ id: 'n1' }], codeProjects: [], codeVersions: [], customExercises: [], submissions: [], bookmarks: [], certificationProgress: [], activityDays: [], settings: {} };
    const backup = parseBackup(JSON.stringify({ format: 'study-hub-backup', version: 1, exportedAt: 'a', ...empty }));
    expect(backup.version).toBe(2);
    expect(backup.importantDates).toEqual([]);
  });

  it('rejects files that are not Study Hub backups', () => {
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/u);
    expect(() => parseBackup('{"format":"other"}')).toThrow(/not a Study Hub backup/u);
  });
});
