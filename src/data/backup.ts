/** Reading backup files: the format is checked before anything is imported. */
import { z } from 'zod';
import { dayKey } from '@/lib/dates';
import type { BackupFile } from './records';

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

const backupSchema = z.discriminatedUnion('version', [
  // Version 1 also held the removed notebook's notes; they are not imported.
  z.object({ ...commonFields, version: z.literal(1) }),
  z.object({ ...commonFields, version: z.literal(2), semesters: records, timetableClasses: records, importantDates: records }),
]);

export function parseBackup(text: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) throw new Error('This is not a Study Hub backup (expected the "study-hub-backup" format, version 1 or 2).');
  const backup = result.data.version === 2 ? result.data : { ...result.data, version: 2 as const, semesters: [], timetableClasses: [], importantDates: [] };
  // Records were written by Study Hub's own export; their inner shape is trusted from there.
  return backup as unknown as BackupFile;
}

export const backupFileName = (date = new Date()) => `study-hub-backup-${dayKey(date)}.json`;
