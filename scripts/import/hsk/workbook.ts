/**
 * HSK Standard Course workbooks: the exercises are in the workbook, their answers and the
 * listening scripts in the teacher's book (练习册听力文本及参考答案).
 *
 * The answer key gives ranges per lesson ("5-8: B A E D", "13-17: ××√√") under section
 * headings in two columns. A range is only used when it has exactly one answer per
 * question. The workbook has no recordings in your materials, so listening exercises are
 * practised by reading their script; pronunciation and character writing need audio or a
 * pen and are left out.
 */
import { editDistance } from '../../../src/domain/evaluation/distance.ts';
import { compactCjk } from '../../../src/domain/evaluation/normalize.ts';
import type { OcrLine, OcrPage, SourceInfo } from '../ocr.ts';
import { type CourseInput, pad2, type QuestionInput } from '../shared.ts';

export type WorkbookSection = 'listening' | 'reading';

export interface KeyRange {
  section: WorkbookSection;
  from: number;
  to: number;
  answers: string[];
}

/** The model test (模拟试卷) at the back of the workbook is keyed as lesson 0. */
export const MODEL_TEST = 0;

export interface LessonKey {
  lesson: number;
  /** Teacher's-book page holding the answer key. */
  page: number;
  ranges: KeyRange[];
  /** Listening scripts by question number. */
  scripts: Map<number, string[]>;
  /** Ranges whose answer count did not match the question count (to be read from the page). */
  rejected: RejectedRange[];
}

export interface RejectedRange {
  section: WorkbookSection;
  from: number;
  to: number;
  text: string;
  page: number;
  bbox: OcrLine['bbox'];
}

export interface WorkbookPart {
  section: WorkbookSection;
  from: number;
  to: number;
  /** Workbook pages showing the part (its header page, plus the next when it runs on). */
  pages: number[];
}

const KEY_RUNNING_HEADER = /练习册听力文本及参考答案/u;
const LESSON_HEADING = /^第\s*(\d{1,2})\s*课/u;
const MODEL_TEST_HEADING = /模拟试卷/u;
const CONTENTS = /目\s*录|Contents/u;
const SECTION_HEADINGS: Array<[RegExp, WorkbookSection | 'other']> = [
  [/^(一、?)?\s*听力/u, 'listening'],
  [/^(二、?)?\s*阅读/u, 'reading'],
  [/^[三四五]、/u, 'other'],
];
const RANGE = /^(\d{1,2})\s*[-－–~]\s*(\d{1,2})\s*[:：]?\s*(.+)$/u;
const JUDGEMENT: Record<string, string> = { '√': '✓', '✓': '✓', '✔': '✓', '×': '✗', 'X': '✗', 'x': '✗', '✗': '✗' };
const PART_RANGE = /第\s*(\d{1,2})\s*[-－–~]\s*(\d{1,2})\s*题?/u;
const SCRIPT_ITEM = /^(\d{1,2})\s*[.．、]\s*(.*)$/u;

const toHalfWidth = (text: string) => text.replace(/[０-９]/gu, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
const sortedLines = (page: OcrPage) => [...page.lines].sort((a, b) => a.bbox[1] - b.bbox[1] || a.bbox[0] - b.bbox[0]);

function sectionOf(text: string): WorkbookSection | 'other' | undefined {
  return SECTION_HEADINGS.find(([pattern]) => pattern.test(text.trim()))?.[1];
}

/** Answers in a range: ✓/✗ judgements or option letters, one per question. */
function answerTokens(text: string): string[] {
  return Array.from(toHalfWidth(text).replace(/\s+/gu, ''))
    .map((character) => JUDGEMENT[character] ?? (/[A-Z]/u.test(character) ? character : ''))
    .filter(Boolean);
}

const KEY_HEADING = /参考答案/u;

/**
 * A page's lines in reading order. Scripts read top to bottom; the answer key is set in two
 * columns, read left column first, so a range at the top of the right column continues the
 * section that ended the left one.
 * @param inKey whether the page starts inside an answer key carried over from the previous page
 */
function readingOrder(page: OcrPage, inKey: boolean): OcrLine[] {
  // No running headers or page numbers, but keep a lesson heading set unusually high on its page.
  const inBody = (line: OcrLine) => line.bbox[1] >= 0.07 && line.bbox[1] <= 0.9;
  const lines = sortedLines(page).filter((line) => inBody(line) || LESSON_HEADING.test(line.text.trim()));
  const ordered: OcrLine[] = [];
  let block: OcrLine[] = [];
  let blockIsKey = inKey;
  const flush = () => {
    ordered.push(...(blockIsKey ? [...block].sort((a, b) => Math.sign(a.bbox[0] - 0.5) - Math.sign(b.bbox[0] - 0.5) || a.bbox[1] - b.bbox[1]) : block));
    block = [];
  };
  for (const line of lines) {
    const text = line.text.trim();
    if (KEY_HEADING.test(text) || LESSON_HEADING.test(text) || (line.bbox[1] < 0.2 && MODEL_TEST_HEADING.test(text))) {
      flush();
      ordered.push(line);
      blockIsKey = KEY_HEADING.test(text);
      continue;
    }
    block.push(line);
  }
  flush();
  return ordered;
}

/** Answer keys and listening scripts for every lesson in the teacher's book. */
export function parseWorkbookKey(pages: OcrPage[]): LessonKey[] {
  const keys: LessonKey[] = [];
  let current: LessonKey | undefined;
  let inKey = false;
  let scriptSection: WorkbookSection | 'other' | undefined;
  let scriptItem: string[] | undefined;
  // The block starts on the page before the first one carrying its running header.
  const firstHeaderPage = pages.findIndex((page) => page.lines.some((line) => line.bbox[1] < 0.06 && KEY_RUNNING_HEADER.test(line.text)));
  if (firstHeaderPage < 0) return keys;

  let keySection: WorkbookSection | 'other' | undefined;
  for (const page of pages.slice(Math.max(0, firstHeaderPage - 1))) {
    for (const line of readingOrder(page, inKey)) {
      const text = toHalfWidth(line.text.trim());
      const lesson = LESSON_HEADING.exec(text);
      const modelTest = !lesson && line.bbox[1] < 0.2 && MODEL_TEST_HEADING.test(text);
      if (lesson || modelTest) {
        current = { lesson: lesson ? Number(lesson[1]) : MODEL_TEST, page: page.page, ranges: [], scripts: new Map(), rejected: [] };
        keys.push(current);
        inKey = false;
        // The model test's script is all listening and has no 一、听力 heading.
        scriptSection = modelTest ? 'listening' : undefined;
        scriptItem = undefined;
        continue;
      }
      if (!current) continue;
      if (KEY_HEADING.test(text)) {
        inKey = true;
        keySection = undefined;
        current.page = page.page;
        continue;
      }
      const section = sectionOf(text);
      if (inKey) {
        if (section) {
          keySection = section;
          continue;
        }
        const range = RANGE.exec(text);
        const rangeSection = keySection;
        if (!range || (rangeSection !== 'listening' && rangeSection !== 'reading')) continue;
        const [from, to] = [Number(range[1]), Number(range[2])];
        const answers = answerTokens(range[3] ?? '');
        if (to >= from && answers.length === to - from + 1) current.ranges.push({ section: rangeSection, from, to, answers });
        else current.rejected.push({ section: rangeSection, from, to, text: range[3] ?? '', page: page.page, bbox: line.bbox });
        continue;
      }
      // Scripts, before the key: numbered items under 一、听力.
      if (section) {
        scriptSection = section;
        scriptItem = undefined;
        continue;
      }
      if (scriptSection !== 'listening' || /^第.部分|^第\s*\d/u.test(text)) {
        scriptItem = undefined;
        continue;
      }
      if (/^例如|^现在开始|^一共|考试现在结束/u.test(text)) {
        scriptItem = undefined;
        continue;
      }
      const item = SCRIPT_ITEM.exec(text);
      if (item) {
        scriptItem = [item[2] ?? ''].filter(Boolean);
        current.scripts.set(Number(item[1]), scriptItem);
      } else if (scriptItem) {
        scriptItem.push(text);
      }
    }
  }
  return keys;
}

/**
 * The listening and reading parts of each lesson in the workbook. A lesson starts on the
 * page that shows its title; parts are found by their "第a-b题" headers.
 */
export function locateWorkbookParts(pages: OcrPage[], lessons: Array<{ number: number; titleZh: string }>): Map<number, WorkbookPart[]> {
  const bodyPages = pages.filter((page) => !page.lines.some((line) => line.bbox[1] < 0.15 && CONTENTS.test(line.text)));
  const modelTest = bodyPages.find((page) => page.lines.some((line) => line.bbox[1] < 0.35 && MODEL_TEST_HEADING.test(line.text)));
  const starts = [
    ...lessons.map((lesson) => {
      const title = compactCjk(lesson.titleZh);
      // The workbook occasionally words a title slightly differently (这个 for 那个), so allow one character to differ.
      const matches = (text: string) => {
        const candidate = compactCjk(text);
        return candidate.includes(title) || (title.length >= 4 && candidate.length === title.length && editDistance(candidate, title) <= 1);
      };
      const page = bodyPages.find((candidate) => candidate.page > 4 && candidate.lines.some((line) => line.bbox[1] < 0.2 && title.length > 1 && matches(line.text)));
      return { lesson: lesson.number, page: page?.page };
    }),
    { lesson: MODEL_TEST, page: modelTest?.page },
  ]
    .filter((start): start is { lesson: number; page: number } => start.page !== undefined)
    .sort((a, b) => a.page - b.page);

  const result = new Map<number, WorkbookPart[]>();
  starts.forEach((start, index) => {
    const end = starts[index + 1]?.page ?? pages.length + 1;
    const parts: WorkbookPart[] = [];
    let section: WorkbookSection | 'other' | undefined;
    for (const page of pages.filter((candidate) => candidate.page >= start.page && candidate.page < end)) {
      for (const line of sortedLines(page)) {
        const text = toHalfWidth(line.text.trim());
        const heading = sectionOf(text);
        if (heading) {
          section = heading;
          continue;
        }
        const range = PART_RANGE.exec(text);
        if (range && (section === 'listening' || section === 'reading') && line.bbox[0] < 0.4) {
          parts.push({ section, from: Number(range[1]), to: Number(range[2]), pages: [page.page] });
        }
      }
    }
    // A part runs on to the next page when the next part starts on a later page.
    parts.forEach((part, partIndex) => {
      const next = parts[partIndex + 1];
      const page = part.pages[0]!;
      if ((!next || next.pages[0]! > page) && page + 1 < end) part.pages.push(page + 1);
    });
    result.set(start.lesson, parts);
  });
  return result;
}

/** The part that holds a question, matched by number within its section. */
export function partFor(parts: WorkbookPart[], section: WorkbookSection, question: number): WorkbookPart | undefined {
  return parts.find((part) => part.section === section && question >= part.from && question <= part.to);
}

/** Option ids for a part: the judgements, or letters A.. up to the highest one used (at least C). */
export function optionIds(answers: string[]): string[] {
  const letters = answers.flatMap((answer) => answer.split('/'));
  if (letters.every((letter) => letter === '✓' || letter === '✗')) return ['✓', '✗'];
  const highest = Math.max(...letters.map((letter) => letter.charCodeAt(0)), 'C'.charCodeAt(0));
  return Array.from({ length: highest - 64 }, (_, index) => String.fromCharCode(65 + index));
}


// ---------------------------------------------------------------------------
// Building the course unit
// ---------------------------------------------------------------------------

/** A key range read from the page by a person, replacing one OCR could not read in full. */
export interface KeyCorrection {
  source: string;
  lesson: number;
  section: WorkbookSection;
  from: number;
  to: number;
  /** One answer per question; "F/G" accepts either. */
  answers: string[];
  note: string;
}

/** Fill the rejected ranges from reviewed corrections; returns the corrections that matched nothing. */
export function applyKeyCorrections(sourceId: string, keys: LessonKey[], corrections: KeyCorrection[]): string[] {
  const relevant = corrections.filter((correction) => correction.source === sourceId);
  const used = new Set<KeyCorrection>();
  for (const key of keys) {
    key.rejected = key.rejected.filter((rejected) => {
      const correction = relevant.find(
        (candidate) => candidate.lesson === key.lesson && candidate.section === rejected.section && candidate.from === rejected.from && candidate.to === rejected.to,
      );
      if (!correction || correction.answers.length !== correction.to - correction.from + 1) return true;
      used.add(correction);
      key.ranges.push({ section: correction.section, from: correction.from, to: correction.to, answers: correction.answers });
      return false;
    });
  }
  return relevant.filter((correction) => !used.has(correction)).map((correction) => `${correction.source} lesson ${correction.lesson} ${correction.from}-${correction.to}`);
}

export interface WorkbookInput {
  courseId: string;
  workbook: SourceInfo;
  teacher: SourceInfo;
  lessons: Array<{ number: number; titleZh: string }>;
  keys: LessonKey[];
  parts: Map<number, WorkbookPart[]>;
  /** Volume letter ("A", "B") for levels split into two books, so each volume's model test stays apart. */
  volume?: string;
}

export interface WorkbookStats {
  questions: number;
  /** Questions in the key whose part was not found in the workbook. */
  unplaced: number;
  rejected: RejectedRange[];
}

const SECTION_LABELS: Record<WorkbookSection, string> = { listening: '听力 Listening', reading: '阅读 Reading' };
const OPTION_TEXT: Record<string, string> = { '✓': '✓ (对)', '✗': '✗ (错)' };

function workbookQuestion(input: WorkbookInput, key: LessonKey, range: KeyRange, part: WorkbookPart, question: number, lessonId: string): QuestionInput {
  const answer = range.answers[question - range.from] ?? '';
  const script = range.section === 'listening' ? key.scripts.get(question) : undefined;
  const heading = `**${SECTION_LABELS[range.section]} · questions ${part.from}–${part.to}** · Question ${question}`;
  const prompt =
    range.section === 'listening'
      ? `${heading}\n\nThere is no recording in your materials, so read the recording script and answer from the page.\n\n${(script ?? ['(script not found)']).map((line) => `> ${line}`).join('\n>\n')}`
      : `${heading}\n\nAnswer from the page.`;
  return {
    id: `${lessonId}.${range.section === 'listening' ? 'l' : 'r'}${pad2(question)}`,
    type: 'choice',
    skill: 'recognize',
    topics: [`${input.courseId}.workbook`],
    prompt,
    options: optionIds(range.answers).map((id) => ({ id, text: OPTION_TEXT[id] ?? id })),
    correct: answer.split('/'),
    shuffle: false,
    answerHint: 'Choose the answer as printed in the workbook.',
    media: part.pages.map((page) => ({ kind: 'page-image' as const, sourceId: input.workbook.id, page })),
    explanation: `Answer from the key in ${input.teacher.title}, PDF page ${key.page}.`,
    source: { origin: 'user-material', sourceId: input.workbook.id, title: input.workbook.title, page: part.pages[0] },
    tags: ['hsk', 'workbook', range.section],
  };
}

/** A workbook's lessons: one per textbook lesson with exercises, then its model test. */
export type WorkbookLesson = CourseInput['units'][number]['lessons'][number];

export function buildWorkbookLessons(input: WorkbookInput): { lessons: WorkbookLesson[]; stats: WorkbookStats } {
  const stats: WorkbookStats = { questions: 0, unplaced: 0, rejected: input.keys.flatMap((key) => key.rejected) };
  const titles = new Map(input.lessons.map((lesson) => [lesson.number, lesson.titleZh]));
  const lessons = input.keys
    .map((key) => {
      const parts = input.parts.get(key.lesson) ?? [];
      const testId = `test${input.volume ? `-${input.volume.toLowerCase()}` : ''}`;
      const lessonId = `${input.courseId}.wb.${key.lesson === MODEL_TEST ? testId : `l${pad2(key.lesson)}`}`;
      const questions = key.ranges
        .sort((a, b) => (a.section === b.section ? a.from - b.from : a.section === 'listening' ? -1 : 1))
        .flatMap((range) =>
          Array.from({ length: range.to - range.from + 1 }, (_, offset) => range.from + offset).flatMap((question) => {
            const part = partFor(parts, range.section, question);
            if (!part) {
              stats.unplaced++;
              return [];
            }
            return [workbookQuestion(input, key, range, part, question, lessonId)];
          }),
        );
      if (questions.length === 0) return undefined;
      stats.questions += questions.length;
      const pages = [...new Set(parts.flatMap((part) => part.pages))].sort((a, b) => a - b);
      const title =
        key.lesson === MODEL_TEST ? `Model test${input.volume ? ` ${input.volume}` : ''} (模拟试卷)` : `Workbook ${key.lesson} · ${titles.get(key.lesson) ?? ''}`.trim();
      return {
        id: lessonId,
        title,
        summary: `${questions.length} listening and reading exercises from the workbook, checked with the teacher's book answer key.`,
        estimatedMinutes: Math.max(10, questions.length),
        topics: [`${input.courseId}.workbook`],
        blocks: [
          {
            kind: 'callout' as const,
            tone: 'info' as const,
            body:
              'Exercises as printed in your workbook, answered from the page and checked against the key in the teacher\'s book. ' +
              'Listening exercises show their recording script, since your materials have no recordings. ' +
              'Pronunciation and character-writing exercises need audio or a pen and are not included.',
          },
          ...(pages.length ? [{ kind: 'source-pages' as const, sourceId: input.workbook.id, pages, caption: `${input.workbook.title}, PDF pages ${pages[0]}–${pages.at(-1)}` }] : []),
        ],
        questions,
        source: { origin: 'user-material' as const, sourceId: input.workbook.id, title: input.workbook.title, page: pages[0] },
      };
    })
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== undefined)
    // Lessons in book order, the model test last.
    .sort((a, b) => (a.id.includes('.wb.test') ? 1 : b.id.includes('.wb.test') ? -1 : a.id.localeCompare(b.id)));
  return { lessons, stats };
}
