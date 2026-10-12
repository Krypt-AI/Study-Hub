/**
 * Message protocol between the app and the code-execution workers.
 * Kept free of DOM and worker globals so both TypeScript projects can import it.
 */

export type RunnableLanguage = 'python' | 'javascript' | 'typescript' | 'sql';

export type RunTest =
  | { kind: 'assert'; name: string; code: string }
  | { kind: 'stdout'; name: string; stdin: string; expected: string };

export interface RunRequest {
  id: string;
  language: RunnableLanguage;
  code: string;
  /** Text fed to input() / stdin for a plain run. */
  stdin?: string;
  tests?: RunTest[];
  /** Pyodide packages to load before running (python only). */
  packages?: string[];
  /** SQL: statements that create and seed the practice database. */
  setupSql?: string;
  /** SQL: reference query whose result the learner's query is compared with. */
  solutionSql?: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  stdout?: string;
}

export interface TableResult {
  columns: string[];
  rows: unknown[][];
}

export type RunStatus = 'ok' | 'error' | 'timeout';

export interface RunResponse {
  id: string;
  status: RunStatus;
  stdout: string;
  stderr: string;
  /** Uncaught error of a plain run, already formatted for display. */
  error?: string;
  durationMs: number;
  tests: TestResult[];
  /** SQL: result sets of the learner's statements, in order. */
  tables?: TableResult[];
  /** SQL: result set of the reference query. */
  expected?: TableResult;
}

export type WorkerInbound = { type: 'run'; request: RunRequest };

export type WorkerOutbound =
  /** Runtime loaded (e.g. Pyodide downloaded and initialised). */
  | { type: 'ready' }
  /** Human-readable loading progress, e.g. "Loading numpy". */
  | { type: 'status'; id: string; message: string }
  /** User code started executing: the execution time limit starts now. */
  | { type: 'started'; id: string }
  | { type: 'result'; response: RunResponse };

/** Output is capped so a runaway print loop cannot exhaust memory. */
export const MAX_OUTPUT_CHARS = 200_000;

export function appendCapped(current: string, addition: string): string {
  if (current.length >= MAX_OUTPUT_CHARS) return current;
  const next = current + addition;
  return next.length > MAX_OUTPUT_CHARS ? `${next.slice(0, MAX_OUTPUT_CHARS)}\n… output truncated …` : next;
}

/** Compare program output with the expected output, ignoring trailing whitespace. */
export function outputsMatch(actual: string, expected: string): boolean {
  const clean = (text: string) =>
    text
      .replace(/\r\n/gu, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  return clean(actual) === clean(expected);
}
