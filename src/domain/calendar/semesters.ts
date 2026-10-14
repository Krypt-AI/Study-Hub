/**
 * Semesters as the learner sees them: the terms of the University catalog (university.yaml) plus any
 * the learner added themselves (for a semester whose materials are not in Study Hub yet). A name in
 * both is one semester. Only learner-added semesters can be removed in the app.
 */
import type { ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { isDated } from './calendar';

export interface Term {
  name: string;
  /** Listed in university.yaml; cannot be removed in the app. */
  fromCatalog: boolean;
  /** The learner's saved record (dates, or the semester itself when they added it). */
  semester?: SemesterRecord;
}

export const MAX_SEMESTER_NAME_LENGTH = 40;

/** Names are compared without regard to case or extra spaces: "sem 2  2026" is "Sem 2 2026". */
const nameKey = (name: string) => name.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();

/**
 * Every semester, newest first: those the learner added (most recently added first), then the
 * catalog's terms in their authored order (newest first).
 */
export function mergeTerms(catalogTerms: string[], semesters: SemesterRecord[]): Term[] {
  const recordOf = new Map(semesters.map((semester) => [nameKey(semester.term), semester]));
  const catalogKeys = new Set(catalogTerms.map(nameKey));
  const added = semesters
    .filter((semester) => semester.addedByLearner && !catalogKeys.has(nameKey(semester.term)))
    .sort((a, b) => (b.createdAt ?? b.updatedAt).localeCompare(a.createdAt ?? a.updatedAt))
    .map((semester): Term => ({ name: semester.term, fromCatalog: false, semester }));
  const catalog = catalogTerms.map((name): Term => ({ name, fromCatalog: true, semester: recordOf.get(nameKey(name)) }));
  return [...added, ...catalog];
}

/** The trimmed name of a new semester, or why it cannot be added. */
export function checkSemesterName(name: string, terms: Term[]): { name: string } | { error: string } {
  const trimmed = name.trim().replace(/\s+/gu, ' ');
  if (!trimmed) return { error: 'Type the semester’s name, for example "Sem 2 2026".' };
  if (trimmed.length > MAX_SEMESTER_NAME_LENGTH) return { error: `Use ${MAX_SEMESTER_NAME_LENGTH} characters or fewer.` };
  const existing = terms.find((term) => nameKey(term.name) === nameKey(trimmed));
  if (existing) return { error: `${existing.name} is already in the list.` };
  return { name: trimmed };
}

/**
 * The semester to show first: the one whose dates contain today; else the catalog's current term
 * (the semester the catalog is set to); else the newest.
 */
export function defaultTerm(terms: Term[], currentTerm: string | undefined, today: string): string | undefined {
  const running = terms.find((term) => isDated(term.semester) && term.semester.startsOn <= today && today <= term.semester.endsOn);
  if (running) return running.name;
  if (currentTerm && terms.some((term) => term.name === currentTerm)) return currentTerm;
  return terms[0]?.name;
}

/** The classes and dates that belong to a semester, which go with it when it is removed. */
export function semesterContents(term: string, classes: TimetableClassRecord[], dates: ImportantDateRecord[]) {
  return { classes: classes.filter((entry) => entry.term === term), dates: dates.filter((entry) => entry.term === term) };
}

/** "2 classes and 1 date", "no classes or dates". */
export function contentsLabel({ classes, dates }: ReturnType<typeof semesterContents>): string {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (!classes.length && !dates.length) return 'no classes or dates';
  return `${count(classes.length, 'class', 'classes')} and ${count(dates.length, 'date', 'dates')}`;
}
