/**
 * Human-reviewed corrections (content/corrections/*.json). Each entry was checked against
 * the page image; applying them replaces OCR errors with what is printed in the book.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LessonOutline } from './hsk/lessons.ts';
import type { VocabularyRow } from './hsk/vocabularyIndex.ts';
import type { Shin500Item } from './jlpt/shin500.ts';

interface RowCorrection {
  source: string;
  page: number;
  word: string;
  /** `word` repairs a headword printed on two lines that OCR split. */
  set?: Partial<Pick<VocabularyRow, 'word' | 'pinyin' | 'meaning' | 'partOfSpeech' | 'lesson'>>;
  verified?: boolean;
  note: string;
}

interface LessonTitleCorrection {
  source: string;
  lesson: number;
  set: Partial<Pick<LessonOutline, 'titleZh' | 'titlePinyin' | 'titleEn'>>;
  note: string;
}

interface CorrectionsFile {
  entries: RowCorrection[];
  lessonTitles?: LessonTitleCorrection[];
}

/** A numbered question (新にほんご500問), identified by its book and printed number. */
interface QuestionCorrection {
  source: string;
  number: number;
  set?: Partial<Pick<Shin500Item, 'answer'>>;
  verified?: boolean;
  note: string;
}

interface QuestionCorrectionsFile {
  entries: QuestionCorrection[];
}

function readCorrectionsFile<T extends { entries: unknown[] }>(name: string): T {
  const path = join(process.cwd(), 'content', 'corrections', `${name}.json`);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as T) : ({ entries: [] } as unknown as T);
}

export const loadCorrections = (name: string) => readCorrectionsFile<CorrectionsFile>(name);
export const loadQuestionCorrections = (name: string) => readCorrectionsFile<QuestionCorrectionsFile>(name);
/** A corrections file holding `{ entries: T[] }` (shape checked by its consumer). */
export const loadJsonCorrections = <T>(name: string): T[] => readCorrectionsFile<{ entries: T[] }>(name).entries;

export interface CorrectionResult<T> {
  items: T[];
  applied: number;
  /** Corrections that matched nothing: the OCR or parser output changed and they need re-checking. */
  unused: string[];
}

export function applyRowCorrections(sourceId: string, rows: VocabularyRow[], corrections: CorrectionsFile): CorrectionResult<VocabularyRow> {
  const relevant = corrections.entries.filter((entry) => entry.source === sourceId);
  const used = new Set<RowCorrection>();
  const items = rows.map((row) => {
    const correction = relevant.find((entry) => entry.page === row.page && entry.word === row.word);
    if (!correction) return row;
    used.add(correction);
    if (correction.set) return { ...row, ...correction.set, flags: ['corrected-after-review'] };
    return { ...row, flags: ['verified-against-page'] };
  });
  return {
    items,
    applied: used.size,
    unused: relevant.filter((entry) => !used.has(entry)).map((entry) => `${entry.source} p${entry.page} ${entry.word}`),
  };
}

export function applyLessonTitleCorrections(sourceId: string, lessons: LessonOutline[], corrections: CorrectionsFile): CorrectionResult<LessonOutline> {
  const relevant = (corrections.lessonTitles ?? []).filter((entry) => entry.source === sourceId);
  const used = new Set<LessonTitleCorrection>();
  const items = lessons.map((lesson) => {
    const correction = relevant.find((entry) => entry.lesson === lesson.number);
    if (!correction) return lesson;
    used.add(correction);
    // The opening page was checked, so title and printed-number warnings no longer apply.
    const checked = (flag: string) => flag === 'title-pinyin-unverified' || flag === 'missing-english-title' || flag.startsWith('printed-number-');
    return { ...lesson, ...correction.set, flags: lesson.flags.filter((flag) => !checked(flag)) };
  });
  return {
    items,
    applied: used.size,
    unused: relevant.filter((entry) => !used.has(entry)).map((entry) => `${entry.source} lesson ${entry.lesson}`),
  };
}

export function applyQuestionCorrections(sourceId: string, questions: Shin500Item[], corrections: QuestionCorrectionsFile): CorrectionResult<Shin500Item> {
  const relevant = corrections.entries.filter((entry) => entry.source === sourceId);
  const used = new Set<QuestionCorrection>();
  const items = questions.map((question) => {
    const correction = relevant.find((entry) => entry.number === question.number);
    if (!correction) return question;
    used.add(correction);
    if (correction.set) return { ...question, ...correction.set, flags: ['corrected-after-review'] };
    return { ...question, flags: ['verified-against-page'] };
  });
  return {
    items,
    applied: used.size,
    unused: relevant.filter((entry) => !used.has(entry)).map((entry) => `${entry.source} #${entry.number}`),
  };
}
