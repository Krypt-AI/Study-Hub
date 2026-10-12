import { describe, expect, it } from 'vitest';
import { questionSchema } from '@/domain/content/schema';
import type { CodeQuestion, SqlQuestion } from '@/domain/content/types';
import type { RunResponse } from '@/workers/protocol';
import { codeFeedback, compareTables, sqlFeedback } from './runFeedback';

const base = { source: { origin: 'authored' }, skill: 'apply', prompt: 'Q' };
const run = (overrides: Partial<RunResponse>): RunResponse => ({ id: 'r', status: 'ok', stdout: '', stderr: '', durationMs: 1, tests: [], ...overrides });

describe('codeFeedback', () => {
  const question = questionSchema.parse({
    ...base,
    id: 'add',
    type: 'code',
    language: 'python',
    tests: [
      { kind: 'assert', name: 'adds positives', code: 'assert add(2, 3) == 5' },
      { kind: 'assert', name: 'adds negatives', code: 'assert add(-1, -1) == -2' },
    ],
    solution: 'def add(a, b):\n    return a + b',
  }) as CodeQuestion;

  it('is correct when every test passes', () => {
    const result = codeFeedback(question, run({ tests: [{ name: 'adds positives', passed: true }, { name: 'adds negatives', passed: true }] }));
    expect(result).toMatchObject({ verdict: 'correct', score: 1 });
  });

  it('gives partial credit and reports the failing test', () => {
    const result = codeFeedback(
      question,
      run({ tests: [{ name: 'adds positives', passed: true }, { name: 'adds negatives', passed: false, message: 'AssertionError' }] }),
    );
    expect(result.verdict).toBe('partial');
    expect(result.parts?.[1]).toMatchObject({ verdict: 'incorrect', message: 'AssertionError' });
  });

  it('scores a timeout as zero', () => {
    expect(codeFeedback(question, run({ status: 'timeout', error: 'Stopped' })).score).toBe(0);
  });
});

describe('SQL comparison', () => {
  const expected = { columns: ['name', 'total'], rows: [['Ana', 30], ['Ben', 12.5]] };

  it('ignores row order unless required', () => {
    const reversed = { columns: ['n', 't'], rows: [['Ben', 12.5], ['Ana', 30]] };
    expect(compareTables(reversed, expected, false).equal).toBe(true);
    expect(compareTables(reversed, expected, true).messages[0]).toContain('ORDER BY');
  });

  it('explains column and row count mismatches', () => {
    expect(compareTables({ columns: ['name'], rows: [['Ana'], ['Ben']] }, expected, false).messages[0]).toContain('2 column');
    expect(compareTables({ columns: ['a', 'b'], rows: [['Ana', 30]] }, expected, false).messages[0]).toContain('Expected 2 row');
  });

  it('builds feedback from a run', () => {
    const question = questionSchema.parse({ ...base, id: 's', type: 'sql', schema: 'CREATE TABLE t(x);', solution: 'SELECT 1;' }) as SqlQuestion;
    expect(sqlFeedback(question, run({ tables: [expected], expected })).verdict).toBe('correct');
    expect(sqlFeedback(question, run({ status: 'error', error: 'SQL error: no such table' })).points[0]?.message).toContain('no such table');
  });
});
