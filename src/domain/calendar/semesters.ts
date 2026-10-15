/**
 * Semesters as the learner sees them: only the ones they added (no semester is preset), each with its
 * dates and the subjects they chose for it. A term that only classes or dates refer to (kept from before
 * semesters were listed) is still a semester, so nothing the learner saved disappears.
 */
import type { ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { isDated } from './calendar';

export interface Term {
  name: string;
  /** The learner's saved record: its dates and chosen subjects. Absent for a term only classes or dates refer to. */
  semester?: SemesterRecord;
}

export const MAX_SEMESTER_NAME_LENGTH = 40;

/** Names are compared without regard to case or extra spaces: "sem 2  2026" is "Sem 2 2026". */
const nameKey = (name: string) => name.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();

/**
 * Every semester, newest added first, then the terms that only classes or dates name (`referenced`).
 */
export function mergeTerms(semesters: SemesterRecord[], referenced: string[] = []): Term[] {
  const saved = [...semesters]
    .sort((a, b) => (b.createdAt ?? b.updatedAt).localeCompare(a.createdAt ?? a.updatedAt))
    .map((semester): Term => ({ name: semester.term, semester }));
  const known = new Set(saved.map((term) => nameKey(term.name)));
  const unsaved: Term[] = [];
  for (const name of referenced) {
    if (known.has(nameKey(name))) continue;
    known.add(nameKey(name));
    unsaved.push({ name });
  }
  return [...saved, ...unsaved];
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

/** The semester to show first: the one whose dates contain today, else the newest. */
export function defaultTerm(terms: Term[], today: string): string | undefined {
  const running = terms.find((term) => isDated(term.semester) && term.semester.startsOn <= today && today <= term.semester.endsOn);
  return running?.name ?? terms[0]?.name;
}

/**
 * The University subjects of a semester: the ones the learner linked a class to in the timetable, then
 * the ones they picked on the Courses page. `linked` is the first part, which the timetable decides.
 */
export function semesterCourseIds(term: string, record: SemesterRecord | undefined, classes: TimetableClassRecord[]): { linked: string[]; chosen: string[]; all: string[] } {
  const linked = [...new Set(classes.filter((entry) => entry.term === term && entry.courseId).map((entry) => entry.courseId as string))];
  const chosen = (record?.courseIds ?? []).filter((id) => !linked.includes(id));
  return { linked, chosen, all: [...linked, ...chosen] };
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
