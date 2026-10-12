/**
 * Feedback for answers that are executed: code (judged by its tests) and SQL (judged by
 * comparing the result set with the reference query's result set).
 */
import type { CodeQuestion, SqlQuestion } from '@/domain/content/types';
import type { RunResponse, TableResult } from '@/workers/protocol';
import { HEADLINES } from './evaluate';
import type { Feedback, FeedbackPart, FeedbackPoint } from './types';

export function codeFeedback(question: CodeQuestion, run: RunResponse): Feedback {
  const points: FeedbackPoint[] = [];
  if (run.status === 'timeout') points.push({ tone: 'error', message: run.error ?? 'Time limit exceeded.' });
  else if (run.error) points.push({ tone: 'error', message: run.error });

  const expected = question.solution ? [question.solution] : [];
  if (question.tests.length === 0) {
    return {
      verdict: 'self-review',
      score: run.status === 'ok' ? 0.5 : 0,
      headline: HEADLINES['self-review'],
      points,
      missing: [],
      expected,
      limitations: 'This exercise has no automated tests. Check your output against the task and the model solution.',
    };
  }

  const parts: FeedbackPart[] = run.tests.map((test) => ({
    label: test.name,
    verdict: test.passed ? 'correct' : 'incorrect',
    message: test.message,
  }));
  const passed = run.tests.filter((test) => test.passed).length;
  const total = question.tests.length;
  const score = run.status === 'timeout' ? 0 : passed / total;
  const verdict = score >= 0.999 ? 'correct' : score > 0 ? 'partial' : 'incorrect';
  points.unshift({ tone: verdict === 'correct' ? 'success' : 'info', message: `${passed} of ${total} test(s) passed.` });
  return { verdict, score, headline: HEADLINES[verdict], points, missing: [], expected, parts };
}

type Cell = string | number | null;

function normalizeCell(value: unknown): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isInteger(value) ? value : Math.round(value * 1e9) / 1e9;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Uint8Array) return `blob:${Array.from(value).join(',')}`;
  return String(value);
}

const rowKey = (row: unknown[]) => JSON.stringify(row.map(normalizeCell));

export interface TableComparison {
  equal: boolean;
  messages: string[];
}

export function compareTables(actual: TableResult | undefined, expected: TableResult, orderMatters: boolean): TableComparison {
  if (!actual) return { equal: false, messages: ['Your SQL did not return any rows. Did you write a SELECT query?'] };
  if (actual.columns.length !== expected.columns.length) {
    return {
      equal: false,
      messages: [`Expected ${expected.columns.length} column(s) (${expected.columns.join(', ')}), your query returned ${actual.columns.length}.`],
    };
  }
  const actualRows = actual.rows.map(rowKey);
  const expectedRows = expected.rows.map(rowKey);
  if (actualRows.length !== expectedRows.length) {
    return { equal: false, messages: [`Expected ${expectedRows.length} row(s), your query returned ${actualRows.length}.`] };
  }
  const sameOrdered = actualRows.every((row, index) => row === expectedRows[index]);
  if (sameOrdered) return { equal: true, messages: [] };
  const sameUnordered = [...actualRows].sort().join('\n') === [...expectedRows].sort().join('\n');
  if (sameUnordered && !orderMatters) return { equal: true, messages: [] };
  if (sameUnordered) return { equal: false, messages: ['The rows are right but in the wrong order. Check your ORDER BY.'] };
  const expectedSet = new Set(expectedRows);
  const wrong = actualRows.filter((row) => !expectedSet.has(row)).length;
  return { equal: false, messages: [`${wrong} of your ${actualRows.length} row(s) do not appear in the expected result.`] };
}

export function sqlFeedback(question: SqlQuestion, run: RunResponse): Feedback {
  const expected = [question.solution];
  if (run.status !== 'ok' || !run.expected) {
    return {
      verdict: 'incorrect',
      score: 0,
      headline: HEADLINES.incorrect,
      points: [{ tone: 'error', message: run.error ?? 'The query could not be run.' }],
      missing: [],
      expected,
    };
  }
  const comparison = compareTables(run.tables?.at(-1), run.expected, question.orderMatters);
  const verdict = comparison.equal ? 'correct' : 'incorrect';
  return {
    verdict,
    score: comparison.equal ? 1 : 0,
    headline: HEADLINES[verdict],
    points: comparison.messages.map((message) => ({ tone: 'error' as const, message })),
    missing: [],
    expected,
  };
}
