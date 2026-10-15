import { describe, expect, it } from 'vitest';
import type { ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { checkSemesterName, contentsLabel, defaultTerm, mergeTerms, semesterContents, semesterCourseIds } from './semesters';

const added = (term: string, createdAt: string, extra: Partial<SemesterRecord> = {}): SemesterRecord => ({ term, ...extra, createdAt, updatedAt: createdAt });
const lesson = (id: string, term: string, courseId?: string) => ({ id, term, courseId }) as TimetableClassRecord;

describe('semesters', () => {
  it('lists only the learner’s semesters, newest added first, then terms only classes or dates name', () => {
    const terms = mergeTerms([added('Sem 3 2026', '2026-10-02'), added('Sem 2 2026', '2026-10-03')], ['sem 2  2026', 'Short sem', 'short sem']);
    expect(terms.map((term) => term.name)).toEqual(['Sem 2 2026', 'Sem 3 2026', 'Short sem']);
    expect(terms[2]?.semester).toBeUndefined();
    expect(mergeTerms([], [])).toEqual([]);
  });

  it('trims a new name and rejects an empty or duplicate one', () => {
    const terms = mergeTerms([added('Sem 1 2026', 'a')]);
    expect(checkSemesterName('  Sem 2   2026 ', terms)).toEqual({ name: 'Sem 2 2026' });
    expect(checkSemesterName('   ', terms)).toHaveProperty('error');
    expect(checkSemesterName('sem 1 2026', terms)).toEqual({ error: 'Sem 1 2026 is already in the list.' });
  });

  it('opens the semester running today, else the newest', () => {
    const terms = mergeTerms([added('Sem 2 2026', '2026-10-03'), added('Short sem', '2026-10-01', { startsOn: '2026-10-01', endsOn: '2026-10-31' })]);
    expect(defaultTerm(terms, '2026-10-14')).toBe('Short sem');
    expect(defaultTerm(terms, '2026-11-14')).toBe('Sem 2 2026');
    expect(defaultTerm([], '2026-10-14')).toBeUndefined();
  });

  it('takes a semester’s subjects from its timetable first, then the learner’s picks', () => {
    const classes = [lesson('a', 'Sem 1', 'web'), lesson('b', 'Sem 1', 'web'), lesson('c', 'Sem 1'), lesson('d', 'Sem 2', 'ml')];
    const record = added('Sem 1', 'a', { courseIds: ['web', 'hci'] });
    expect(semesterCourseIds('Sem 1', record, classes)).toEqual({ linked: ['web'], chosen: ['hci'], all: ['web', 'hci'] });
    expect(semesterCourseIds('Sem 2', undefined, classes)).toEqual({ linked: ['ml'], chosen: [], all: ['ml'] });
  });

  it('says what goes with a removed semester', () => {
    const date = (id: string, term?: string) => ({ id, term }) as ImportantDateRecord;
    const contents = semesterContents('Sem 2 2026', [lesson('a', 'Sem 2 2026'), lesson('b', 'Sem 2 2026'), lesson('c', 'Sem 1 2026')], [date('d', 'Sem 2 2026'), date('e')]);
    expect(contentsLabel(contents)).toBe('2 classes and 1 date');
    expect(contentsLabel(semesterContents('Empty', [], []))).toBe('no classes or dates');
  });
});
