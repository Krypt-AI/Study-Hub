/**
 * Content QA: proves every code exercise is solvable by running its reference solution
 * against its own tests (Python via a local interpreter, SQL via sql.js, JS/TS in a VM).
 *
 *   npm run content:verify
 *
 * Reads the built course files in public/content, so run `npm run content:build` first.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import initSqlJs from 'sql.js';
import { transform } from 'sucrase';
import type { CodeQuestion, Course, Question, SqlQuestion } from '../src/domain/content/types.ts';
import { outputsMatch } from '../src/workers/protocol.ts';

const COURSES_DIR = join(process.cwd(), 'public', 'content', 'courses');
const PYTHON = process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
/** Languages whose reference solutions this script can run (C, Java and Bash are editor-only). */
const VERIFIABLE_LANGUAGES = new Set<CodeQuestion['language']>(['python', 'javascript', 'typescript']);

interface Failure {
  question: string;
  test: string;
  detail: string;
}

function allQuestions(course: Course): Question[] {
  return [
    ...course.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.questions)),
    ...course.assessments.flatMap((assessment) => assessment.sections.flatMap((section) => section.questions)),
  ];
}

function runPython(source: string, stdin = ''): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync(PYTHON, ['-I', '-c', source], { input: stdin, encoding: 'utf8', timeout: 10_000 });
  return { ok: result.status === 0, stdout: result.stdout ?? '', stderr: result.stderr ?? String(result.error ?? '') };
}

function verifyPython(question: CodeQuestion): Failure[] {
  const failures: Failure[] = [];
  for (const test of question.tests) {
    if (test.kind === 'assert') {
      const result = runPython(`${question.solution}\n${test.code}`);
      if (!result.ok) failures.push({ question: question.id, test: test.name, detail: result.stderr.trim().split('\n').at(-1) ?? '' });
    } else {
      const result = runPython(question.solution ?? '', test.stdin);
      if (!result.ok || !outputsMatch(result.stdout, test.expected)) {
        failures.push({ question: question.id, test: test.name, detail: `stdout ${JSON.stringify(result.stdout)} ${result.stderr.trim()}` });
      }
    }
  }
  return failures;
}

function verifyJavaScript(question: CodeQuestion): Failure[] {
  const failures: Failure[] = [];
  const compile = (code: string) => (question.language === 'typescript' ? transform(code, { transforms: ['typescript'] }).code : code);
  for (const test of question.tests) {
    let output = '';
    const sandbox = {
      console: { log: (...values: unknown[]) => (output += `${values.join(' ')}\n`) },
      assert: (condition: unknown, message = 'Assertion failed') => {
        if (!condition) throw new Error(message);
      },
      assertEqual: (actual: unknown, expected: unknown, message?: string) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message ?? `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      },
      input: (() => {
        const lines = test.kind === 'stdout' && test.stdin ? test.stdin.replace(/\n$/u, '').split('\n') : [];
        return () => lines.shift() ?? null;
      })(),
    };
    try {
      const body = test.kind === 'assert' ? `${question.solution}\n;\n${test.code}` : (question.solution ?? '');
      runInNewContext(compile(body), sandbox, { timeout: 5000 });
      if (test.kind === 'stdout' && !outputsMatch(output, test.expected)) failures.push({ question: question.id, test: test.name, detail: `stdout ${JSON.stringify(output)}` });
    } catch (error) {
      failures.push({ question: question.id, test: test.name, detail: error instanceof Error ? error.message : String(error) });
    }
  }
  return failures;
}

async function verifySql(question: SqlQuestion): Promise<Failure[]> {
  const SQL = await initSqlJs();
  const database = new SQL.Database();
  try {
    database.exec(question.schema);
    const result = database.exec(question.solution);
    if (result.length === 0) return [{ question: question.id, test: 'solution returns rows', detail: 'the reference query returned no result set' }];
    return [];
  } catch (error) {
    return [{ question: question.id, test: 'schema and solution run', detail: error instanceof Error ? error.message : String(error) }];
  } finally {
    database.close();
  }
}

async function main(): Promise<void> {
  const failures: Failure[] = [];
  let checked = 0;
  let skipped = 0;
  for (const file of readdirSync(COURSES_DIR).filter((name) => name.endsWith('.json'))) {
    const course = JSON.parse(readFileSync(join(COURSES_DIR, file), 'utf8')) as Course;
    for (const question of allQuestions(course)) {
      if (question.type === 'sql') {
        checked++;
        failures.push(...(await verifySql(question)));
      } else if (question.type === 'code') {
        if (!question.solution || question.tests.length === 0 || !VERIFIABLE_LANGUAGES.has(question.language)) {
          skipped++;
          continue;
        }
        checked++;
        failures.push(...(question.language === 'python' ? verifyPython(question) : verifyJavaScript(question)));
      }
    }
  }
  for (const failure of failures) console.error(`FAIL ${failure.question} [${failure.test}]: ${failure.detail}`);
  console.log(`Verified ${checked} exercise(s); ${skipped} without a runnable solution; ${failures.length} failure(s).`);
  if (failures.length) process.exit(1);
}

await main();
