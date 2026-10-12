import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { outputsMatch } from '../protocol';
import { PYODIDE_VERSION } from './pyodideVersion';
import { formatPythonTraceback } from './pythonErrors';
import { deepEqual, formatLogArguments, inspect } from './values';

describe('pyodide version', () => {
  it('matches the installed pyodide package used for types', () => {
    const installed = JSON.parse(readFileSync('node_modules/pyodide/package.json', 'utf8')) as { version: string };
    expect(PYODIDE_VERSION).toBe(installed.version);
  });
});

describe('formatPythonTraceback', () => {
  it('keeps only frames from the learner code', () => {
    const raw = [
      'Traceback (most recent call last):',
      '  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async',
      '    await CodeRunner(',
      '  File "<your code>", line 2, in <module>',
      '    print(1 / 0)',
      'ZeroDivisionError: division by zero',
    ].join('\n');
    expect(formatPythonTraceback(raw)).toBe(
      ['Traceback (most recent call last):', '  File "<your code>", line 2, in <module>', '    print(1 / 0)', 'ZeroDivisionError: division by zero'].join('\n'),
    );
  });

  it('drops an empty traceback header', () => {
    const raw = 'Traceback (most recent call last):\n  File "/lib/python314.zip/_pyodide/_base.py", line 1, in x\n    y\nSyntaxError: invalid syntax';
    expect(formatPythonTraceback(raw)).toBe('SyntaxError: invalid syntax');
  });
});

describe('values', () => {
  it('formats console output like a browser console', () => {
    expect(formatLogArguments(['total:', 3, [1, 'a'], { b: true }])).toBe("total: 3 [ 1, 'a' ] { b: true }");
    expect(inspect(new Map([['k', 1]]))).toBe("Map(1) { 'k' => 1 }");
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(inspect(circular)).toBe('{ self: [Circular] }');
  });

  it('compares structures deeply', () => {
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('compares program output ignoring trailing whitespace', () => {
    expect(outputsMatch('a  \nb\n\n', 'a\nb')).toBe(true);
    expect(outputsMatch('a\nc', 'a\nb')).toBe(false);
  });
});
