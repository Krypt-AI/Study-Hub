/**
 * Main-thread manager for the code-execution workers. One worker per runtime, runs queued
 * per runtime, and a hard time limit enforced by terminating the worker (which also stops
 * infinite loops that no in-language timeout could interrupt).
 */
import type { RunnableLanguage, RunRequest, RunResponse, WorkerInbound, WorkerOutbound } from '@/workers/protocol';

type Runtime = 'python' | 'javascript' | 'sql';

const runtimeOf = (language: RunnableLanguage): Runtime => (language === 'typescript' ? 'javascript' : language);

function createWorker(runtime: Runtime): Worker {
  switch (runtime) {
    case 'python':
      return new Worker(new URL('../../../workers/python.worker.ts', import.meta.url), { type: 'module', name: 'python-runner' });
    case 'javascript':
      return new Worker(new URL('../../../workers/javascript.worker.ts', import.meta.url), { type: 'module', name: 'javascript-runner' });
    case 'sql':
      return new Worker(new URL('../../../workers/sql.worker.ts', import.meta.url), { type: 'module', name: 'sql-runner' });
  }
}

export interface RunOptions {
  /** Limit on executing the learner's code (and its tests). */
  timeoutMs: number;
  /** Separate, longer limit for loading the runtime (Python downloads Pyodide on first use). */
  loadTimeoutMs?: number;
  onStatus?: (message: string) => void;
}

export const RUNNABLE_LANGUAGES: ReadonlySet<string> = new Set<RunnableLanguage>(['python', 'javascript', 'typescript', 'sql']);

/** Languages with a sandboxed runtime; the rest (C, Bash) are editor-only. */
export const isRunnableLanguage = (language: string): language is RunnableLanguage => RUNNABLE_LANGUAGES.has(language);

class CodeRunner {
  private workers = new Map<Runtime, Worker>();
  private queues = new Map<Runtime, Promise<unknown>>();
  private cancelCurrent = new Map<Runtime, () => void>();

  run(request: RunRequest, options: RunOptions): Promise<RunResponse> {
    const runtime = runtimeOf(request.language);
    const previous = this.queues.get(runtime) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(() => this.execute(runtime, request, options));
    this.queues.set(runtime, next);
    return next;
  }

  /** Stop whatever is running in this runtime (the worker is discarded and restarted lazily). */
  stop(language: RunnableLanguage): void {
    this.cancelCurrent.get(runtimeOf(language))?.();
  }

  private worker(runtime: Runtime): Worker {
    let worker = this.workers.get(runtime);
    if (!worker) {
      worker = createWorker(runtime);
      this.workers.set(runtime, worker);
    }
    return worker;
  }

  private discard(runtime: Runtime): void {
    this.workers.get(runtime)?.terminate();
    this.workers.delete(runtime);
  }

  private execute(runtime: Runtime, request: RunRequest, options: RunOptions): Promise<RunResponse> {
    const worker = this.worker(runtime);
    const startedAt = performance.now();
    return new Promise<RunResponse>((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const finish = (response: RunResponse) => {
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        this.cancelCurrent.delete(runtime);
        resolve(response);
      };
      const abort = (status: RunResponse['status'], error: string) => {
        this.discard(runtime);
        finish({ id: request.id, status, stdout: '', stderr: '', error, durationMs: performance.now() - startedAt, tests: [] });
      };
      const onMessage = (event: MessageEvent<WorkerOutbound>) => {
        const message = event.data;
        if (message.type === 'status' && message.id === request.id) options.onStatus?.(message.message);
        if (message.type === 'started' && message.id === request.id) {
          clearTimeout(timer);
          timer = setTimeout(
            () => abort('timeout', `Stopped after ${Math.round(options.timeoutMs / 1000)} s: the time limit was reached (an infinite loop?).`),
            options.timeoutMs,
          );
        }
        if (message.type === 'result' && message.response.id === request.id) finish(message.response);
      };
      const onError = (event: ErrorEvent) => abort('error', `The ${runtime} runtime failed: ${event.message || 'unknown error'}`);

      this.cancelCurrent.set(runtime, () => abort('error', 'Stopped.'));
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      timer = setTimeout(
        () => abort('error', 'The runtime took too long to load. Python downloads Pyodide (about 10 MB) the first time, so check your connection.'),
        options.loadTimeoutMs ?? 120_000,
      );
      worker.postMessage({ type: 'run', request } satisfies WorkerInbound);
    });
  }
}

/** One runner for the whole app: runtimes stay warm between exercises. */
export const codeRunner = new CodeRunner();
