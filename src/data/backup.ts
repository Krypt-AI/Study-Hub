/** Reading backup files: the format is checked before anything is imported. */
import { z } from 'zod';
import { dayKey } from '@/lib/dates';
import { type BackupFile, normalizeTimetableClass } from './records';

const records = z.array(z.record(z.string(), z.unknown()));

const commonFields = {
  format: z.literal('study-hub-backup'),
  exportedAt: z.string(),
  attempts: records,
  lessonProgress: records,
  reviewStates: records,
  topicMastery: records,
  codeProjects: records,
  codeVersions: records,
  customExercises: records,
  submissions: records,
  bookmarks: records,
  certificationProgress: records,
  activityDays: records,
  settings: z.record(z.string(), z.unknown()),
};

const calendarFields = { semesters: records, timetableClasses: records, importantDates: records };

const backupSchema = z.discriminatedUnion('version', [
  // Version 1 also held the removed notebook's notes; they are not imported.
  z.object({ ...commonFields, version: z.literal(1) }),
  z.object({ ...commonFields, version: z.literal(2), ...calendarFields }),
  z.object({ ...commonFields, version: z.literal(3), ...calendarFields, examDrafts: records }),
]);

export function parseBackup(text: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) throw new Error('This is not a Study Hub backup (expected the "study-hub-backup" format, version 1, 2 or 3).');
  // Older versions lack the calendar (version 1) and unfinished exam sittings (versions 1 and 2).
  const backup = { semesters: [], timetableClasses: [], importantDates: [], examDrafts: [], ...result.data, version: 3 as const } as unknown as BackupFile;
  // Records were written by Study Hub's own export; their inner shape is trusted from there, brought up to current kinds.
  return { ...backup, timetableClasses: backup.timetableClasses.map(normalizeTimetableClass) };
}

export const backupFileName = (date = new Date()) => `study-hub-backup-${dayKey(date)}.json`;
