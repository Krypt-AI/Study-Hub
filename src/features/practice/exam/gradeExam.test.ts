import { describe, expect, it } from 'vitest';
import { assessmentSchema } from '@/domain/content/schema';
import { answerContexts, gradeSection, passed, scoreExam } from './gradeExam';

const source = { origin: 'user-material' as const };
const numbered = (id: string, correct: string) => ({
  id,
  type: 'choice',
  skill: 'recognize',
  prompt: id,
  options: ['1', '2', '3', '4'].map((option) => ({ id: option, text: option })),
  correct: [correct],
  shuffle: false,
  topics: ['t'],
  source,
});

const assessment = assessmentSchema.parse({
  id: 'mock',
  title: 'Mock',
  kind: 'mock-exam',
  passMark: 0.5,
  source,
  sections: [{ id: 's1', title: 'S1', questions: [numbered('a', '1'), numbered('b', '2'), numbered('c', '3')] }],
});

describe('exam marking', () => {
  it('marks answers, scores unanswered questions as zero and records only answered ones', async () => {
    const [section] = assessment.sections;
    if (!section) throw new Error('the fixture has a section');
    const graded = await gradeSection(section, { a: { type: 'choice', selected: ['1'] }, b: { type: 'choice', selected: ['4'] } }, 60_000);

    expect(graded.items.map((item) => [item.question.id, item.answered, item.feedback.verdict])).toEqual([
      ['a', true, 'correct'],
      ['b', true, 'incorrect'],
      ['c', false, 'incorrect'],
    ]);
    const score = scoreExam([graded]);
    expect(score).toEqual({ points: 1, max: 3, pending: 0 });
    expect(passed(assessment, score)).toBe(false);
    expect(answerContexts('course', assessment, graded.items).map((context) => [context.question.id, context.mode, context.firstAttemptInSession])).toEqual([
      ['a', 'mock-exam', true],
      ['b', 'mock-exam', true],
    ]);
  });

  it('weighs each question by its marks', async () => {
    const paper = assessmentSchema.parse({ ...assessment, sections: [{ id: 's1', title: 'S1', questions: [{ ...numbered('a', '1'), marks: 2 }, { ...numbered('b', '2'), marks: 3 }] }] });
    const graded = await gradeSection(paper.sections[0]!, { a: { type: 'choice', selected: ['1'] }, b: { type: 'choice', selected: ['1'] } }, 0);
    expect(scoreExam([graded])).toEqual({ points: 2, max: 5, pending: 0 });
  });

  it('counts only the questions chosen in a "choose one" section', async () => {
    const paper = assessmentSchema.parse({ ...assessment, sections: [{ id: 's1', title: 'S1', choose: 1, questions: [{ ...numbered('a', '1'), marks: 30 }, { ...numbered('b', '2'), marks: 30 }, { ...numbered('c', '3'), marks: 30 }] }] });
    const section = paper.sections[0]!;
    const chosen = await gradeSection(section, { b: { type: 'choice', selected: ['2'] } }, 0);
    expect(chosen.items.map((item) => [item.question.id, item.counted])).toEqual([
      ['a', false],
      ['b', true],
      ['c', false],
    ]);
    expect(scoreExam([chosen])).toEqual({ points: 30, max: 30, pending: 0 });
    // None chosen: the section still counts once, at zero.
    expect(scoreExam([await gradeSection(section, {}, 0)])).toEqual({ points: 0, max: 30, pending: 0 });
  });

  it('has no pass verdict without a pass mark', () => {
    expect(passed({ ...assessment, passMark: undefined }, { points: 3, max: 3, pending: 0 })).toBeUndefined();
  });
});
