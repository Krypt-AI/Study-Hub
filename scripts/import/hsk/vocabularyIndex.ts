/**
 * Parses the vocabulary index at the back of an HSK Standard Course textbook
 * (词语总表: word, pinyin, part of speech, meaning, lesson) from positioned OCR lines.
 * Table rows are rebuilt by anchoring on the headword column; every field is validated
 * and problems are attached as flags instead of being silently "fixed".
 */
import { editDistance } from '../../../src/domain/evaluation/distance.ts';
import { parsePinyin } from '../../../src/domain/evaluation/pinyin.ts';
import { centerY, HAS_CJK, left, lineHeight, type OcrLine, type OcrPage } from '../ocr.ts';

/** new-words: the main list; built-from-known: new words made of characters already learned (旧字新词). */
export type IndexSection = 'new-words' | 'proper-nouns' | 'beyond-syllabus' | 'built-from-known';

export interface VocabularyRow {
  word: string;
  pinyin: string;
  partOfSpeech?: string;
  meaning: string;
  lesson: number;
  /** Introduced in the lesson's grammar notes rather than its word list ("5 (notes)"). */
  fromNotes: boolean;
  /** Marked with * in the book: not part of the HSK syllabus for this level. */
  beyondSyllabus: boolean;
  section: IndexSection;
  page: number;
  /** Lowest OCR confidence among the row's fields. */
  confidence: number;
  flags: string[];
}

const SECTION_MARKERS: Array<[RegExp, IndexSection | 'skip' | 'end']> = [
  [/专有名词|Proper Nouns/u, 'proper-nouns'],
  [/超纲词|Not Included/u, 'beyond-syllabus'],
  [/旧字新词|Learned before/u, 'built-from-known'],
  // The header reads "补充 Supplementary Vocabulary"; 补充 alone is also a headword (HSK 5).
  [/Supplementary/u, 'skip'],
  [/汉字总表|偏旁总表/u, 'end'],
  // The back cover (from HSK 4 on, the index runs up to it): publisher's blurb.
  [/国家汉办官方认证|ISBN/u, 'end'],
  [/生词\s*New Words|^生词$/u, 'new-words'],
];

/** Parts of speech used by the series (from the books' own abbreviation tables). */
const PARTS_OF_SPEECH = ['n', 'v', 'adj', 'adv', 'pron', 'num', 'm', 'num.-m', 'mod', 'aux', 'prep', 'conj', 'part', 'int', 'onom', 'pref', 'suf'];

const TABLE_HEADER =
  /^(词语|拼音|词性|词义|课号|级别|新词|旧字|Word\/Phrase|New Words?|Pinyin|Part of Speech|Meaning|Lesson|Level|Learned Characters|来自本册.*|From This ?Book)$/u;
/** Sections whose extra right-hand column holds CJK text (HSK level, or the characters already learned). */
const SECTIONS_WITH_CJK_COLUMN: IndexSection[] = ['beyond-syllabus', 'built-from-known'];
const LETTER_DIVIDER = /^[A-Z]$/u;
const LESSON = /^(\d{1,2})\s*(\((?:notes?|注释)\))?$/u;
const HEADWORD = /^\*?[\p{Script=Han}…·（）()]+$/u;

export function normalizePartOfSpeech(raw: string): { value?: string; corrected: boolean } {
  const cleaned = raw.trim().replace(/,$/u, '.');
  let corrected = cleaned !== raw.trim();
  const tokens = cleaned
    .toLowerCase()
    .replace(/\s+/gu, '')
    .split('/')
    .map((token) => token.replace(/\.$/u, ''));
  const normalized: string[] = [];
  for (const token of tokens) {
    if (PARTS_OF_SPEECH.includes(token)) {
      normalized.push(token);
      continue;
    }
    const withoutDigits = token.replace(/^\d+|\d+$/gu, ''); // OCR noise such as "n1" or "1n"
    const candidates = PARTS_OF_SPEECH.filter((pos) => pos.length >= 3 && editDistance(pos, token) === 1);
    if (withoutDigits && PARTS_OF_SPEECH.includes(withoutDigits)) {
      normalized.push(withoutDigits);
      corrected = true;
    } else if (candidates.length === 1 && candidates[0]) {
      normalized.push(candidates[0]);
      corrected = true;
    } else {
      return { corrected: false };
    }
  }
  return { value: normalized.map((token) => `${token}.`).join('/'), corrected };
}

/** A word with two accepted readings is printed "zhǔyi / zhúyi". */
export function readingsOf(pinyin: string): string[] {
  return pinyin.split('/').map((reading) => reading.trim()).filter(Boolean);
}

const isReading = (text: string) => readingsOf(text).length > 0 && readingsOf(text).every((reading) => parsePinyin(reading) !== null);

const isPartOfSpeech = (text: string) => /^[A-Za-z.,\-/\d\s]{1,14}$/u.test(text) && normalizePartOfSpeech(text).value !== undefined;

/** A part of speech that OCR merged into the start of the meaning text ("aux. maybe"). */
function splitLeadingPartOfSpeech(meaning: string): { partOfSpeech?: string; rest: string } {
  const match = /^(\d?[A-Za-z]{1,5}[.,](?:-[a-z]\.)?(?:\/[A-Za-z]{1,5}\.)*)[\s.]+(.+)$/u.exec(meaning);
  if (!match?.[1] || !match[2]) return { rest: meaning };
  const normalized = normalizePartOfSpeech(match[1]);
  return normalized.value ? { partOfSpeech: normalized.value, rest: match[2].replace(/^[\s.,]+/u, '') } : { rest: meaning };
}

/** Characters that should each correspond to one pinyin syllable. */
function syllableBearingCharacters(word: string): number {
  return Array.from(word).filter((character) => /\p{Script=Han}/u.test(character)).length;
}

interface RowDraft {
  anchor: OcrLine;
  cells: OcrLine[];
  section: IndexSection;
  page: number;
}

function sectionChange(line: OcrLine): IndexSection | 'skip' | 'end' | undefined {
  if (line.text.length > 70) return undefined;
  return SECTION_MARKERS.find(([pattern]) => pattern.test(line.text))?.[1];
}

function isNoise(line: OcrLine): boolean {
  const text = line.text.trim();
  return TABLE_HEADER.test(text) || (LETTER_DIVIDER.test(text) && left(line) > 0.35 && left(line) < 0.65) || line.bbox[1] > 0.95;
}

/**
 * OCR occasionally merges two stacked single-character headwords into one tall box
 * ("找着" for 找 above 着). Split such boxes back into one anchor per row.
 */
function splitMergedAnchors(anchors: OcrLine[]): OcrLine[] {
  const heights = anchors.map(lineHeight).sort((a, b) => a - b);
  const typical = heights[Math.floor(heights.length / 2)] ?? 0;
  if (!typical) return anchors;
  return anchors.flatMap((anchor) => {
    const characters = Array.from(anchor.text.replace(/\s/gu, ''));
    const ratio = lineHeight(anchor) / typical;
    // A merged box spans roughly one row per character (allowing for row spacing).
    if (characters.length < 2 || ratio < 1.6 || ratio < characters.length * 0.75 || ratio > characters.length * 1.5) return [anchor];
    const [x0, y0, x1, y1] = anchor.bbox;
    const step = (y1 - y0) / characters.length;
    return characters.map((character, index) => ({
      ...anchor,
      text: character,
      bbox: [x0, y0 + step * index, x1, y0 + step * (index + 1)] as OcrLine['bbox'],
    }));
  });
}

const OPEN_ENDED = /……$/u;

/**
 * A paired construction is printed on two stacked lines ("不但……" over "而且……") with one
 * pinyin cell per line and a single part of speech, meaning and lesson. Merge such rows.
 */
function mergePairedConstructions(rows: RowDraft[]): RowDraft[] {
  const merged: RowDraft[] = [];
  for (const row of rows) {
    const previous = merged.at(-1);
    const stacked =
      previous &&
      previous.section === row.section &&
      OPEN_ENDED.test(previous.anchor.text.trim()) &&
      OPEN_ENDED.test(row.anchor.text.trim()) &&
      row.anchor.bbox[1] - previous.anchor.bbox[3] < lineHeight(previous.anchor) * 0.8;
    if (!stacked) {
      merged.push(row);
      continue;
    }
    const isPinyin = (cell: OcrLine) => left(cell) < 0.4 && isReading(cell.text);
    const pinyinCells = [...previous.cells, ...row.cells].filter(isPinyin).sort((a, b) => a.bbox[1] - b.bbox[1]);
    const joinedPinyin = pinyinCells[0] && {
      ...pinyinCells[0],
      text: pinyinCells.map((cell) => cell.text.trim()).join(''),
      score: Math.min(...pinyinCells.map((cell) => cell.score)),
    };
    merged[merged.length - 1] = {
      ...previous,
      anchor: {
        ...previous.anchor,
        text: previous.anchor.text.trim() + row.anchor.text.trim(),
        score: Math.min(previous.anchor.score, row.anchor.score),
        bbox: [previous.anchor.bbox[0], previous.anchor.bbox[1], Math.max(previous.anchor.bbox[2], row.anchor.bbox[2]), row.anchor.bbox[3]],
      },
      cells: [...[...previous.cells, ...row.cells].filter((cell) => !isPinyin(cell)), ...(joinedPinyin ? [joinedPinyin] : [])],
    };
  }
  return merged;
}

/** Collect row drafts from the index pages, following section headers across pages. */
function collectRows(pages: OcrPage[]): RowDraft[] {
  const drafts: RowDraft[] = [];
  let section: IndexSection | 'skip' | 'end' | undefined;
  // The table of contents also lists 词语总表, so take the last page carrying the header.
  const indexStart = pages.findLastIndex((page) => page.lines.some((line) => /词语总表/u.test(line.text)));
  if (indexStart < 0) return drafts;

  for (const page of pages.slice(indexStart)) {
    if (section === 'end') break;
    const lines = [...page.lines].sort((a, b) => a.bbox[1] - b.bbox[1]);
    const anchors: Array<{ line: OcrLine; section: IndexSection }> = [];
    const looseCells: Array<{ line: OcrLine; section: IndexSection }> = [];
    for (const line of lines) {
      const change = sectionChange(line);
      if (change) {
        section = change;
        if (change === 'end') break;
        continue;
      }
      if (!section || section === 'skip' || section === 'end' || isNoise(line)) continue;
      const isAnchor = left(line) < 0.2 && HEADWORD.test(line.text.replace(/\s/gu, '')) && HAS_CJK.test(line.text);
      (isAnchor ? anchors : looseCells).push({ line, section });
    }

    const rowsOnPage: RowDraft[] = [];
    for (const sectionName of new Set(anchors.map((anchor) => anchor.section))) {
      const sectionAnchors = splitMergedAnchors(anchors.filter((anchor) => anchor.section === sectionName).map((anchor) => anchor.line));
      rowsOnPage.push(...sectionAnchors.map((line) => ({ anchor: line, cells: [], section: sectionName, page: page.page })));
    }
    for (const { line, section: cellSection } of looseCells) {
      const nearest = rowsOnPage
        .filter((row) => row.section === cellSection)
        .map((row) => ({ row, distance: Math.abs(centerY(row.anchor) - centerY(line)) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance <= Math.max(lineHeight(nearest.row.anchor), lineHeight(line)) * 0.75) nearest.row.cells.push(line);
    }
    drafts.push(...mergePairedConstructions(rowsOnPage.sort((a, b) => a.anchor.bbox[1] - b.anchor.bbox[1])));
  }
  return drafts;
}

function buildRow(draft: RowDraft): VocabularyRow | undefined {
  const flags: string[] = [];
  const cells = [...draft.cells].sort((a, b) => left(a) - left(b));
  const rawWord = draft.anchor.text.replace(/\s/gu, '');
  const beyondSyllabus = rawWord.startsWith('*') || draft.section === 'beyond-syllabus';
  const word = rawWord.replace(/^\*/u, '');

  const lessonCell = [...cells].reverse().find((cell) => left(cell) > 0.6 && LESSON.test(cell.text.trim()));
  const lessonMatch = lessonCell ? LESSON.exec(lessonCell.text.trim()) : null;
  const remaining = cells.filter((cell) => cell !== lessonCell && !(SECTIONS_WITH_CJK_COLUMN.includes(draft.section) && HAS_CJK.test(cell.text)));

  const pinyinCell = remaining.find((cell) => left(cell) < 0.4 && isReading(cell.text));
  const posCell = draft.section === 'proper-nouns' ? undefined : remaining.find((cell) => cell !== pinyinCell && isPartOfSpeech(cell.text));
  const meaningCells = remaining.filter((cell) => cell !== pinyinCell && cell !== posCell && left(cell) > (pinyinCell ? left(pinyinCell) : 0.15));
  let meaning = meaningCells.map((cell) => cell.text.trim()).join(' ').replace(/\s+/gu, ' ');

  let partOfSpeech: string | undefined;
  if (posCell) {
    const normalized = normalizePartOfSpeech(posCell.text);
    partOfSpeech = normalized.value;
    if (normalized.corrected) flags.push(`part-of-speech-normalised:${posCell.text.trim()}`);
  } else if (draft.section !== 'proper-nouns') {
    const split = splitLeadingPartOfSpeech(meaning);
    if (split.partOfSpeech) {
      partOfSpeech = split.partOfSpeech;
      meaning = split.rest;
      flags.push('part-of-speech-recovered-from-meaning');
    } else {
      flags.push('no-part-of-speech');
    }
  }

  if (!lessonMatch) flags.push('missing-lesson');
  if (!pinyinCell) flags.push('missing-or-invalid-pinyin');
  if (!meaning) flags.push('missing-meaning');

  const pinyin = pinyinCell?.text.trim() ?? '';
  const syllables = pinyin ? (parsePinyin(readingsOf(pinyin)[0] ?? '') ?? []) : [];
  if (pinyin && syllables.length !== syllableBearingCharacters(word)) {
    flags.push(`syllable-count:${syllables.length}-for-${syllableBearingCharacters(word)}-characters`);
  }
  if (pinyin && syllables.every((syllable) => syllable.tone === null) && partOfSpeech !== 'part.') flags.push('pinyin-without-tones');

  const confidence = Math.min(draft.anchor.score, ...cells.map((cell) => cell.score));
  if (confidence < 0.9) flags.push('low-ocr-confidence');

  if (!lessonMatch && !pinyin && !meaning) return undefined; // a stray CJK fragment, not a row
  return {
    word,
    pinyin,
    partOfSpeech,
    meaning,
    lesson: lessonMatch ? Number(lessonMatch[1]) : 0,
    fromNotes: Boolean(lessonMatch?.[2]),
    beyondSyllabus,
    section: draft.section,
    page: draft.page,
    confidence: Math.round(confidence * 1000) / 1000,
    flags,
  };
}

export function parseVocabularyIndex(pages: OcrPage[]): VocabularyRow[] {
  return collectRows(pages)
    .map(buildRow)
    .filter((row): row is VocabularyRow => row !== undefined);
}

/** Flags that make a row unusable for practice until it is corrected. */
export const BLOCKING_FLAGS = ['missing-lesson', 'missing-or-invalid-pinyin', 'missing-meaning', 'syllable-count'];

export function isBlocking(flag: string): boolean {
  return BLOCKING_FLAGS.some((blocking) => flag === blocking || flag.startsWith(`${blocking}:`));
}
