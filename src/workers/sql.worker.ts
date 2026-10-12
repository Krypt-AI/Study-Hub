/**
 * SQL runner: SQLite compiled to WebAssembly (sql.js). Every run gets a fresh in-memory
 * database built from the exercise's setup script, so runs never affect each other.
 */
import initSqlJs, { type Database, type QueryExecResult, type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url';
import type { RunRequest, RunResponse, TableResult, WorkerInbound, WorkerOutbound } from './protocol';
import { hardenWorkerGlobals } from './runtime/sandbox';

const absoluteWasmUrl = new URL(wasmUrl, self.location.href).href;
hardenWorkerGlobals([absoluteWasmUrl]);

const post = (message: WorkerOutbound) => self.postMessage(message);

let engine: Promise<SqlJsStatic> | undefined;
const loadEngine = () => (engine ??= initSqlJs({ locateFile: () => absoluteWasmUrl }));

const toTable = (result: QueryExecResult): TableResult => ({ columns: result.columns, rows: result.values });

function createDatabase(sql: SqlJsStatic, setupSql: string | undefined): Database {
  const database = new sql.Database();
  if (setupSql) database.exec(setupSql);
  return database;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function run(request: RunRequest): Promise<RunResponse> {
  const sql = await loadEngine();
  post({ type: 'ready' });

  let expected: TableResult | undefined;
  if (request.solutionSql) {
    const reference = createDatabase(sql, request.setupSql);
    try {
      expected = reference.exec(request.solutionSql).map(toTable).at(-1) ?? { columns: [], rows: [] };
    } finally {
      reference.close();
    }
  }

  post({ type: 'started', id: request.id });
  const started = performance.now();
  const database = createDatabase(sql, request.setupSql);
  try {
    const tables = database.exec(request.code).map(toTable);
    return { id: request.id, status: 'ok', stdout: '', stderr: '', durationMs: performance.now() - started, tests: [], tables, expected };
  } catch (error) {
    return {
      id: request.id,
      status: 'error',
      stdout: '',
      stderr: '',
      error: `SQL error: ${errorMessage(error)}`,
      durationMs: performance.now() - started,
      tests: [],
      expected,
    };
  } finally {
    database.close();
  }
}

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const { request } = event.data;
  try {
    post({ type: 'result', response: await run(request) });
  } catch (caught) {
    post({
      type: 'result',
      response: { id: request.id, status: 'error', stdout: '', stderr: '', error: `SQL runtime error: ${errorMessage(caught)}`, durationMs: 0, tests: [] },
    });
  }
};
