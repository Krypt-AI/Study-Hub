/**
 * Python runner: executes learner code with Pyodide (CPython compiled to WebAssembly)
 * inside this dedicated worker. See ./runtime/sandbox.ts for the isolation measures.
 */
import type { PyodideAPI } from 'pyodide';
import {
  appendCapped,
  outputsMatch,
  type RunRequest,
  type RunResponse,
  type TestResult,
  type WorkerInbound,
  type WorkerOutbound,
} from './protocol';
import { PYODIDE_INDEX_URL } from './runtime/pyodideVersion';
import { formatPythonTraceback, TEST_FILENAME, USER_FILENAME } from './runtime/pythonErrors';
import { hardenWorkerGlobals, pythonJsGlobals } from './runtime/sandbox';

hardenWorkerGlobals([PYODIDE_INDEX_URL]);

const post = (message: WorkerOutbound) => self.postMessage(message);

type PyDict = ReturnType<PyodideAPI['toPy']>;

class OutputBuffer {
  text = '';
  private readonly decoder = new TextDecoder();
  readonly write = (buffer: Uint8Array): number => {
    this.text = appendCapped(this.text, this.decoder.decode(buffer, { stream: true }));
    return buffer.length;
  };
}

let runtime: Promise<PyodideAPI> | undefined;

function loadRuntime(): Promise<PyodideAPI> {
  runtime ??= (async () => {
    const module = (await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`)) as typeof import('pyodide');
    const pyodide = await module.loadPyodide({ indexURL: PYODIDE_INDEX_URL, jsglobals: pythonJsGlobals() });
    post({ type: 'ready' });
    return pyodide;
  })();
  return runtime;
}

function freshNamespace(pyodide: PyodideAPI): PyDict {
  return pyodide.toPy({ __name__: '__main__' });
}

function feedStdin(pyodide: PyodideAPI, text: string): void {
  let consumed = false;
  pyodide.setStdin({
    stdin: () => {
      if (consumed) return null;
      consumed = true;
      return text;
    },
  });
}

function errorText(error: unknown): string {
  return formatPythonTraceback(error instanceof Error ? error.message : String(error));
}

async function loadPackages(pyodide: PyodideAPI, request: RunRequest): Promise<void> {
  const messageCallback = (message: string) => post({ type: 'status', id: request.id, message });
  if (request.packages?.length) await pyodide.loadPackage(request.packages, { messageCallback });
  const allCode = [request.code, ...(request.tests ?? []).map((test) => (test.kind === 'assert' ? test.code : ''))].join('\n');
  await pyodide.loadPackagesFromImports(allCode, { messageCallback });
}

async function runTests(pyodide: PyodideAPI, request: RunRequest): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const test of request.tests ?? []) {
    const output = new OutputBuffer();
    pyodide.setStdout({ write: output.write });
    pyodide.setStderr({ write: output.write });
    const namespace = freshNamespace(pyodide);
    try {
      feedStdin(pyodide, test.kind === 'stdout' ? test.stdin : '');
      await pyodide.runPythonAsync(request.code, { globals: namespace, filename: USER_FILENAME });
      if (test.kind === 'assert') {
        await pyodide.runPythonAsync(test.code, { globals: namespace, filename: TEST_FILENAME });
        results.push({ name: test.name, passed: true, stdout: output.text });
      } else {
        const passed = outputsMatch(output.text, test.expected);
        results.push({
          name: test.name,
          passed,
          stdout: output.text,
          message: passed ? undefined : `Expected output:\n${test.expected}\n\nYour output:\n${output.text || '(nothing)'}`,
        });
      }
    } catch (error) {
      results.push({ name: test.name, passed: false, stdout: output.text, message: errorText(error) });
    } finally {
      namespace.destroy();
    }
  }
  return results;
}

async function run(request: RunRequest): Promise<RunResponse> {
  const pyodide = await loadRuntime();
  await loadPackages(pyodide, request);

  const stdout = new OutputBuffer();
  const stderr = new OutputBuffer();
  pyodide.setStdout({ write: stdout.write });
  pyodide.setStderr({ write: stderr.write });
  feedStdin(pyodide, request.stdin ?? '');

  post({ type: 'started', id: request.id });
  const started = performance.now();
  const namespace = freshNamespace(pyodide);
  let error: string | undefined;
  try {
    await pyodide.runPythonAsync(request.code, { globals: namespace, filename: USER_FILENAME });
  } catch (caught) {
    error = errorText(caught);
  } finally {
    namespace.destroy();
  }
  const tests = await runTests(pyodide, request);
  return {
    id: request.id,
    status: error ? 'error' : 'ok',
    stdout: stdout.text,
    stderr: stderr.text,
    error,
    durationMs: performance.now() - started,
    tests,
  };
}

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const { request } = event.data;
  try {
    post({ type: 'result', response: await run(request) });
  } catch (caught) {
    post({
      type: 'result',
      response: {
        id: request.id,
        status: 'error',
        stdout: '',
        stderr: '',
        error: `Python runtime error: ${caught instanceof Error ? caught.message : String(caught)}`,
        durationMs: 0,
        tests: [],
      },
    });
  }
};
