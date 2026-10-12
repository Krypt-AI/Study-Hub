/**
 * JavaScript / TypeScript runner. TypeScript is transpiled with Sucrase, which strips
 * types without type-checking them. Learner code runs as the body of an async function
 * inside this dedicated worker; see ./runtime/sandbox.ts for the isolation measures.
 */
import { transform } from 'sucrase';
import {
  appendCapped,
  outputsMatch,
  type RunRequest,
  type RunResponse,
  type TestResult,
  type WorkerInbound,
  type WorkerOutbound,
} from './protocol';
import { hardenWorkerGlobals } from './runtime/sandbox';
import { deepEqual, formatLogArguments, inspect } from './runtime/values';

hardenWorkerGlobals();

const post = (message: WorkerOutbound) => self.postMessage(message);

type AsyncFunctionConstructor = new (...parameters: string[]) => (...args: unknown[]) => Promise<unknown>;
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as AsyncFunctionConstructor;

/** Lines the Function wrapper adds before the learner's first line (header + "use strict"). */
const WRAPPER_LINES = 3;

class AssertionError extends Error {
  override name = 'AssertionError';
}

interface Output {
  stdout: string;
  stderr: string;
}

function compile(code: string, language: RunRequest['language']): string {
  return language === 'typescript' ? transform(code, { transforms: ['typescript'], disableESTransforms: true }).code : code;
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) return `Uncaught ${inspect(error)}`;
  const location = /<anonymous>:(\d+):(\d+)/u.exec(error.stack ?? '');
  const line = location ? Number(location[1]) - WRAPPER_LINES : undefined;
  return `${error.name}: ${error.message}${line && line > 0 ? ` (line ${line})` : ''}`;
}

/** Worker globals hidden from learner code (it receives `undefined` for these names). */
const SHADOWED_GLOBALS = ['self', 'globalThis', 'postMessage', 'close', 'onmessage'];

async function execute(source: string, stdin: string, output: Output): Promise<void> {
  const lines = stdin === '' ? [] : stdin.replace(/\r?\n$/u, '').split(/\r?\n/u);
  let nextLine = 0;
  const input = () => (nextLine < lines.length ? (lines[nextLine++] ?? null) : null);
  const write = (stream: keyof Output) => (...values: unknown[]) => {
    output[stream] = appendCapped(output[stream], `${formatLogArguments(values)}\n`);
  };
  const sandboxConsole = { log: write('stdout'), info: write('stdout'), debug: write('stdout'), warn: write('stderr'), error: write('stderr') };
  const assert = (condition: unknown, message = 'Assertion failed') => {
    if (!condition) throw new AssertionError(message);
  };
  const assertEqual = (actual: unknown, expected: unknown, message?: string) => {
    if (!deepEqual(actual, expected)) throw new AssertionError(message ?? `Expected ${inspect(expected)}, got ${inspect(actual)}`);
  };
  const body = new AsyncFunction('console', 'input', 'prompt', 'assert', 'assertEqual', ...SHADOWED_GLOBALS, `"use strict";\n${source}`);
  await body(sandboxConsole, input, input, assert, assertEqual);
}

async function runTests(request: RunRequest): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const test of request.tests ?? []) {
    const output: Output = { stdout: '', stderr: '' };
    try {
      if (test.kind === 'assert') {
        await execute(compile(`${request.code}\n;\n${test.code}`, request.language), '', output);
        results.push({ name: test.name, passed: true, stdout: output.stdout });
      } else {
        await execute(compile(request.code, request.language), test.stdin, output);
        const passed = outputsMatch(output.stdout, test.expected);
        results.push({
          name: test.name,
          passed,
          stdout: output.stdout,
          message: passed ? undefined : `Expected output:\n${test.expected}\n\nYour output:\n${output.stdout || '(nothing)'}`,
        });
      }
    } catch (error) {
      results.push({ name: test.name, passed: false, stdout: output.stdout, message: describeError(error) });
    }
  }
  return results;
}

async function run(request: RunRequest): Promise<RunResponse> {
  const output: Output = { stdout: '', stderr: '' };
  post({ type: 'started', id: request.id });
  const started = performance.now();
  let error: string | undefined;
  try {
    await execute(compile(request.code, request.language), request.stdin ?? '', output);
  } catch (caught) {
    error = caught instanceof SyntaxError && !caught.stack?.includes('<anonymous>') ? `SyntaxError: ${caught.message}` : describeError(caught);
  }
  const tests = await runTests(request);
  return { id: request.id, status: error ? 'error' : 'ok', ...output, error, durationMs: performance.now() - started, tests };
}

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const { request } = event.data;
  post({ type: 'ready' });
  try {
    post({ type: 'result', response: await run(request) });
  } catch (caught) {
    post({
      type: 'result',
      response: { id: request.id, status: 'error', stdout: '', stderr: '', error: describeError(caught), durationMs: 0, tests: [] },
    });
  }
};
