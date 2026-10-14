import { describe, expect, it } from 'vitest';
import { groupAssessments } from './pastPapers';
import type { Assessment } from './types';

const assessment = (id: string, paper?: Assessment['paper']) => ({ id, title: id, kind: 'mock-exam', paper }) as Assessment;

describe('past papers', () => {
  it('groups past papers by kind (midterms, tests, finals) and keeps practice sets apart', () => {
    const { pastPapers, practice } = groupAssessments([assessment('final-2020', 'final'), assessment('mid-2025', 'midterm'), assessment('drill'), assessment('final-2022', 'final')]);
    expect(pastPapers.map((group) => [group.title, group.papers.map((paper) => paper.id)])).toEqual([
      ['Midterms', ['mid-2025']],
      ['Final exams', ['final-2020', 'final-2022']],
    ]);
    expect(practice.map((entry) => entry.id)).toEqual(['drill']);
  });
});
