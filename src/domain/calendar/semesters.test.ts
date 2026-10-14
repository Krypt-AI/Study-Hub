import { describe, expect, it } from 'vitest';
import type { ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { checkSemesterName, contentsLabel, defaultTerm, mergeTerms, semesterContents } from './semesters';

const added = (term: string, createdAt: string, dates?: { startsOn: string; endsOn: string }): SemesterRecord => ({ term, ...dates, addedByLearner: true, createdAt, updatedAt: createdAt });

describe('semesters', () => {
  const catalog = ['Sem 1 2026', 'Sem 2 2025'];

  it('lists the learner’s semesters (newest added first), then the catalog’s, and keeps a shared name once', () => {
    const terms = mergeTerms(catalog, [
      added('Sem 3 2026', '2026-10-02'),
      added('Sem 2 2026', '2026-10-03'),
      added('sem 1  2026', '2026-10-04'),
      { term: 'Sem 1 2026', startsOn: '2026-10-05', endsOn: '2027-01-29', updatedAt: 'a' },
    ]);
    expect(terms.map((term) => [term.name, term.fromCatalog])).toEqual([
      ['Sem 2 2026', false],
      ['Sem 3 2026', false],
      ['Sem 1 2026', true],
      ['Sem 2 2025', true],
    ]);
    expect(terms[2]?.semester?.startsOn).toBe('2026-10-05');
  });

  it('trims a new name and rejects an empty or duplicate one', () => {
    const terms = mergeTerms(catalog, []);
    expect(checkSemesterName('  Sem 2   2026 ', terms)).toEqual({ name: 'Sem 2 2026' });
    expect(checkSemesterName('   ', terms)).toHaveProperty('error');
    expect(checkSemesterName('sem 1 2026', terms)).toEqual({ error: 'Sem 1 2026 is already in the list.' });
  });

  it('opens the semester running today, else the catalog’s current one, else the newest', () => {
    const running = mergeTerms(catalog, [added('Short sem', '2026-10-01', { startsOn: '2026-10-01', endsOn: '2026-10-31' })]);
    expect(defaultTerm(running, 'Sem 1 2026', '2026-10-14')).toBe('Short sem');
    expect(defaultTerm(running, 'Sem 1 2026', '2026-11-14')).toBe('Sem 1 2026');
    expect(defaultTerm(mergeTerms([], [added('Sem 2 2026', 'a')]), undefined, '2026-10-14')).toBe('Sem 2 2026');
    expect(defaultTerm([], undefined, '2026-10-14')).toBeUndefined();
  });

  it('says what goes with a removed semester', () => {
    const lesson = (id: string, term: string) => ({ id, term }) as TimetableClassRecord;
    const date = (id: string, term?: string) => ({ id, term }) as ImportantDateRecord;
    const contents = semesterContents('Sem 2 2026', [lesson('a', 'Sem 2 2026'), lesson('b', 'Sem 2 2026'), lesson('c', 'Sem 1 2026')], [date('d', 'Sem 2 2026'), date('e')]);
    expect(contentsLabel(contents)).toBe('2 classes and 1 date');
    expect(contentsLabel(semesterContents('Empty', [], []))).toBe('no classes or dates');
  });
});
