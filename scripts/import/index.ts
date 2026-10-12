/**
 * Content importer: turns the content pipeline's OCR cache into validated course files.
 *
 *   npm run content:import
 *
 * Imports every source whose OCR is complete, applies the reviewed corrections in
 * content/corrections, validates each course against the content schema and writes
 *   content/generated/courses/<course>.json   (consumed by `npm run content:build`)
 *   content/generated/import-report.md        (what was imported, flagged and left out)
 * Generated files contain material from your own books: they are git-ignored.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { courseSchema } from '../../src/domain/content/schema.ts';
import {
  applyLessonTitleCorrections,
  applyQuestionCorrections,
  applyRowCorrections,
  loadCorrections,
  loadJsonCorrections,
  loadQuestionCorrections,
} from './corrections.ts';
import { buildHskCourse, type HskVolume } from './hsk/buildCourse.ts';
import { findLessons } from './hsk/lessons.ts';
import { parseVocabularyIndex } from './hsk/vocabularyIndex.ts';
import {
  applyKeyCorrections,
  buildWorkbookLessons,
  type KeyCorrection,
  locateWorkbookParts,
  parseWorkbookKey,
  type WorkbookLesson,
  type WorkbookStats,
} from './hsk/workbook.ts';
import { parseAnswerKey, type TestPart, validateAnswerKey } from './jlpt/answerKey.ts';
import { buildSampleTestCourse, type JlptLevel } from './jlpt/buildSampleTest.ts';
import { buildShin500Course } from './jlpt/buildShin500.ts';
import { parseListeningScript } from './jlpt/script.ts';
import { parseShin500 } from './jlpt/shin500.ts';
import { loadManifest, loadPages, type SourceInfo } from './ocr.ts';
import type { CourseInput } from './shared.ts';
import { CEDICT_PATH, loadCedict } from './validation/cedict.ts';

const OUTPUT_DIR = join(process.cwd(), 'content', 'generated');
const COURSES_DIR = join(OUTPUT_DIR, 'courses');

/** Section times printed on the sample-test booklet covers (minutes). */
const SAMPLE_TEST_MINUTES: Record<JlptLevel, Partial<Record<TestPart, number>>> = {
  N5: { vocab: 25, 'grammar-reading': 50, listening: 30 },
  N4: { vocab: 30, 'grammar-reading': 60, listening: 35 },
  N3: { vocab: 30, 'grammar-reading': 70, listening: 40 },
  N2: { language: 105, listening: 50 },
  N1: { language: 110, listening: 60 },
};

const report: string[] = [];
const manifest = loadManifest();

function isComplete(source: SourceInfo | undefined): source is SourceInfo {
  if (!source?.pageCount) return false;
  return loadPages(source).length === source.pageCount;
}

function writeCourse(course: CourseInput): void {
  const parsed = courseSchema.parse(course); // throws with a precise path on any schema error
  mkdirSync(COURSES_DIR, { recursive: true });
  writeFileSync(join(COURSES_DIR, `${parsed.id}.json`), JSON.stringify(course, null, 1), 'utf8');
}

function importHsk(cedict: ReturnType<typeof loadCedict>): void {
  const corrections = loadCorrections('hsk');
  for (const level of [1, 2, 3, 4, 5, 6]) {
    const textbooks = manifest.filter((source) => source.kind === 'hsk-textbook' && source.level === `HSK${level}`);
    if (textbooks.length === 0 || !textbooks.every(isComplete)) continue;

    let lessonOffset = 0;
    const volumes: HskVolume[] = [];
    const unusedCorrections: string[] = [];
    for (const source of textbooks) {
      const pages = loadPages(source);
      const indexPage = pages.findLast((page) => page.lines.some((line) => /词语总表/u.test(line.text)))?.page ?? pages.length + 1;
      // Volume B of a level continues A's lesson numbering in the book.
      const lessons = applyLessonTitleCorrections(source.id, findLessons(pages, indexPage - 1, lessonOffset + 1), corrections);
      const rows = applyRowCorrections(source.id, parseVocabularyIndex(pages), corrections);
      unusedCorrections.push(...lessons.unused, ...rows.unused);
      // Its index normally prints the continued numbers too; renumber it if it restarts at 1.
      const maxRowLesson = Math.max(0, ...rows.items.map((row) => row.lesson));
      const rowsInVolume = lessonOffset > 0 && maxRowLesson <= lessons.items.length ? rows.items.map((row) => ({ ...row, lesson: row.lesson + lessonOffset })) : rows.items;
      volumes.push({ source, lessons: lessons.items, rows: rowsInVolume });
      lessonOffset += lessons.items.length;
    }

    const workbook = importWorkbooks(volumes.map((volume) => ({ source: volume.source, lessons: volume.lessons })), `hsk-${level}`);
    const { course, stats } = buildHskCourse(level, volumes, cedict, workbook.lessons);
    writeCourse(course);
    report.push(
      `## HSK ${level} (${textbooks.map((source) => source.title).join(', ')})`,
      '',
      `- Lessons: ${stats.lessons}; vocabulary entries: ${stats.words}; practice questions: ${stats.questions}`,
      `- CC-CEDICT reading check: ${stats.cedict}`,
      `- Left out (could not be read reliably): ${stats.excluded.length}`,
      ...stats.excluded.map((entry) => `  - ${entry.sourceId} p${entry.page} ${entry.word}: ${entry.flags.join(', ')}`),
      `- Still flagged for review: ${stats.reviewFlags.length}`,
      ...stats.reviewFlags.map((entry) => `  - ${entry.sourceId} p${entry.page} ${entry.word}: ${entry.flags.join(', ')}`),
      ...(unusedCorrections.length ? [`- Corrections that no longer match anything (re-check them): ${unusedCorrections.join('; ')}`] : []),
      ...workbook.report,
      '',
    );
  }
}

/** Workbook exercises for a level's volumes, where both the workbook and the teacher's book are OCR'd. */
function importWorkbooks(volumes: Array<{ source: SourceInfo; lessons: Array<{ number: number; titleZh: string }> }>, courseId: string) {
  const corrections = loadJsonCorrections<KeyCorrection>('hsk-workbook');
  const lessons: WorkbookLesson[] = [];
  const report: string[] = [];
  for (const volume of volumes) {
    const prefix = volume.source.id.replace(/-textbook$/u, '');
    const workbook = manifest.find((candidate) => candidate.id === `${prefix}-workbook`);
    const teacher = manifest.find((candidate) => candidate.id === `${prefix}-teacher`);
    if (!isComplete(workbook) || !isComplete(teacher)) {
      report.push(`- Workbook (${prefix}): not imported yet (its workbook and teacher's book must both be OCR'd)`);
      continue;
    }
    const keys = parseWorkbookKey(loadPages(teacher));
    const unused = applyKeyCorrections(teacher.id, keys, corrections);
    const parts = locateWorkbookParts(loadPages(workbook), volume.lessons);
    const volumeLetter = /\d([ab])$/u.exec(prefix)?.[1]?.toUpperCase();
    const built = buildWorkbookLessons({ courseId, workbook, teacher, lessons: volume.lessons, keys, parts, volume: volumeLetter });
    lessons.push(...built.lessons);
    report.push(...workbookReport(workbook.title, built.stats, unused));
  }
  return { lessons, report };
}

function workbookReport(title: string, stats: WorkbookStats, unusedCorrections: string[]): string[] {
  return [
    `- Workbook (${title}): ${stats.questions} exercises with answers from the teacher's book; ${stats.unplaced} answer(s) whose exercise was not found in the workbook`,
    `- Answer-key ranges OCR could not read in full (need a correction): ${stats.rejected.length}`,
    ...stats.rejected.map((range) => `  - p${range.page} ${range.section} ${range.from}-${range.to}: "${range.text}"`),
    ...(unusedCorrections.length ? [`- Workbook corrections that no longer match anything: ${unusedCorrections.join('; ')}`] : []),
  ];
}

function importSampleTests(): void {
  for (const level of ['N5', 'N4', 'N3', 'N2', 'N1'] satisfies JlptLevel[]) {
    const find = (kind: string) => manifest.find((source) => source.kind === `jlpt-sample-${kind}` && source.level === level);
    const parts = { vocab: find('vocab'), grammar: find('grammar'), reading: find('reading'), listening: find('listening') };
    const answerSource = find('answers');
    const scriptSource = find('script');
    if (!isComplete(answerSource) || !isComplete(scriptSource) || !Object.values(parts).every(isComplete)) continue;
    const minutes = SAMPLE_TEST_MINUTES[level];
    const answers = parseAnswerKey(loadPages(answerSource));
    const missingTimes = [...new Set(answers.map((item) => item.part))].filter((part) => minutes[part] === undefined);
    if (missingTimes.length > 0) {
      report.push(`## JLPT ${level} sample test`, '', `- Skipped: no section time is recorded for ${missingTimes.join(', ')}.`, '');
      continue;
    }

    const problems = validateAnswerKey(answers);
    const transcripts = parseListeningScript(loadPages(scriptSource));
    const booklets = Object.fromEntries(
      Object.entries(parts).map(([key, source]) => [key, { source: source as SourceInfo, pages: loadPages(source as SourceInfo) }]),
    ) as Parameters<typeof buildSampleTestCourse>[0]['booklets'];
    writeCourse(buildSampleTestCourse({ level, answers, transcripts, booklets, answerSource, minutes }));
    const listeningItems = answers.filter((item) => item.part === 'listening');
    const withScript = listeningItems.filter((item) =>
      transcripts.some((transcript) => transcript.mondai === item.mondai && transcript.question === Number.parseInt(item.number, 10)),
    );
    report.push(
      `## JLPT ${level} sample test`,
      '',
      `- Answer key items: ${answers.length} (${answers.filter((item) => item.number === '0').length} listening examples); validation problems: ${problems.length}`,
      ...problems.map((problem) => `  - ${problem}`),
      `- Listening items with a script: ${withScript.length} of ${listeningItems.length} (${transcripts.length} transcripts parsed)`,
      '',
    );
  }
}

function importShin500(): void {
  const corrections = loadQuestionCorrections('shin500');
  for (const source of manifest.filter((candidate) => candidate.kind === 'shin500')) {
    if (isComplete(source)) importShin500Edition(source, corrections);
  }
}

function importShin500Edition(source: SourceInfo, corrections: ReturnType<typeof loadQuestionCorrections>): void {
  const corrected = applyQuestionCorrections(source.id, parseShin500(loadPages(source)), corrections);
  const items = corrected.items;
  const { course, stats } = buildShin500Course(source, items);
  writeCourse(course);
  report.push(
    `## ${source.title}`,
    '',
    `- Questions found: ${items.length} of 500; imported: ${stats.total}; with a typed-answer variant: ${stats.withTypedVariant}`,
    `- Left out (answer could not be read): ${stats.excluded.length}${stats.excluded.length ? ` (${stats.excluded.map((entry) => `#${entry.number}`).join(', ')})` : ''}`,
    `- Imported but flagged for review (shown with a warning, image-based options only): ${stats.needsReview.length}`,
    ...stats.needsReview.map((entry) => `  - #${entry.number}: ${entry.flags.join(', ')}`),
    `- Corrections applied (checked against the page): ${corrected.applied}`,
    ...(corrected.unused.length ? [`- Corrections that no longer match anything (re-check them): ${corrected.unused.join('; ')}`] : []),
    '',
  );
}

const cedict = loadCedict();
importHsk(cedict);
importSampleTests();
importShin500();

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(
  join(OUTPUT_DIR, 'import-report.md'),
  [
    '# Content import report',
    '',
    `Generated ${new Date().toISOString()}. Pinyin cross-check: ${cedict ? `CC-CEDICT (${CEDICT_PATH})` : 'skipped (no CC-CEDICT file)'}.`,
    '',
    ...report,
  ].join('\n'),
  'utf8',
);
console.log(report.filter((line) => line.startsWith('## ') || line.startsWith('- ')).join('\n'));
console.log(`\nWrote ${COURSES_DIR} and ${join(OUTPUT_DIR, 'import-report.md')}`);
