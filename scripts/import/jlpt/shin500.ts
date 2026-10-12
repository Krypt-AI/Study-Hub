/**
 * Parses 新にほんご500問 (ASK Publishing): four weeks of seven days.
 *  - Days 1-6: question pages of three questions (文字, 語彙, 文法 bands, four options each),
 *    each followed by an answer page: correct option, full sentence, English translation, notes.
 *  - Day 7: review pages of six two-option questions that point back to the original
 *    question ("→84"); their answers are printed in the footer of the following page.
 * Questions are numbered by the book's fixed structure (125 per week) and cross-checked
 * against the printed question numbers wherever OCR read them.
 */
import { canonicalKana } from '../../../src/domain/evaluation/kana.ts';
import { compactCjk } from '../../../src/domain/evaluation/normalize.ts';
import { HAS_CJK, lineHeight, type OcrLine, type OcrPage } from '../ocr.ts';

export type Shin500Category = 'moji' | 'goi' | 'bunpou';

export interface Shin500Item {
  number: number;
  week: number;
  day: number;
  category: Shin500Category;
  stem: string;
  options: string[];
  /** 1-based index of the correct option (0 when it could not be read). */
  answer: number;
  questionPage: number;
  /** Vertical extent of the question on its page (relative 0..1). */
  questionBand: [number, number];
  answerPage?: number;
  answerBand?: [number, number];
  /** The full sentence with the answer filled in, as printed on the answer page. */
  sentence?: string;
  translation?: string;
  /** Day-7 review questions: the question being reviewed. */
  reviewOf?: number;
  flags: string[];
}

const QUESTIONS_PER_WEEK = 125;
const QUESTIONS_PER_DAY = 15;
const FIRST_REVIEW_NUMBER = 91; // day 7 follows 6 days x 15 questions
const CATEGORIES: Shin500Category[] = ['moji', 'goi', 'bunpou'];
/** The three question boxes of a page, top to bottom (fixed by the book's layout). */
const BANDS: Array<[number, number]> = [
  [0.14, 0.395],
  [0.395, 0.64],
  [0.64, 0.86],
];
const FURIGANA_MAX_HEIGHT = 0.012;
/** Footer label of the day-7 answers: こたえ in N4–N5, 答え from N3. */
const FOOTER_ANSWERS = /前のページの(?:こたえ|答え)/u;
/** Option numbers are printed in two fixed columns; a vertical list uses only the first. */
const OPTION_MARKER_COLUMNS: Array<[number, number]> = [
  [0.272, 0.3],
  [0.495, 0.53],
];
/** Left edge of the question-number box; the stem itself starts further right. */
const NUMBER_BOX_RIGHT = 0.245;

const toHalfWidth = (text: string) => text.replace(/[０-９]/gu, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
const centre = (line: OcrLine) => (line.bbox[1] + line.bbox[3]) / 2;
const inBand = (line: OcrLine, band: [number, number]) => centre(line) >= band[0] && centre(line) < band[1];
const isFurigana = (line: OcrLine) => lineHeight(line) < FURIGANA_MAX_HEIGHT;
const isCategoryLabel = (line: OcrLine) => /^(もじ|ごい|ぶん[ぽぼ]う)$/u.test(line.text.trim());
const isCheckbox = (line: OcrLine) => line.bbox[0] > 0.62 && /^[\d□口\s]+$/u.test(line.text.trim());
const inMarkerColumn = (line: OcrLine) => OPTION_MARKER_COLUMNS.some(([from, to]) => line.bbox[0] >= from && line.bbox[0] <= to);

// ---------------------------------------------------------------------------
// Page classification
// ---------------------------------------------------------------------------

type PageKind = 'question' | 'answer' | 'other';

interface PageInfo {
  page: OcrPage;
  kind: PageKind;
  day?: number;
  week?: number;
}

function describePage(page: OcrPage): PageInfo {
  const top = page.lines.filter((line) => line.bbox[1] < 0.135).map((line) => line.text.trim());
  const dayText = top.find((text) => /^\d日目$/u.test(text));
  const weekText = top.find((text) => /^第\d週$/u.test(text));
  // Day-7 review spreads carry only the day tab on even pages, not the もんだい header.
  const kind: PageKind = top.includes('こたえ') ? 'answer' : top.includes('もんだい') || dayText ? 'question' : 'other';
  return {
    page,
    kind,
    day: dayText ? Number(dayText[0]) : undefined,
    week: weekText ? Number(weekText[1]) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Shared line handling
// ---------------------------------------------------------------------------

interface Row {
  y: number;
  lines: OcrLine[];
}

function rowsOf(lines: OcrLine[], tolerance = 0.009): Row[] {
  const rows: Row[] = [];
  for (const line of [...lines].sort((a, b) => a.bbox[1] - b.bbox[1])) {
    const row = rows.find((candidate) => Math.abs(candidate.y - centre(line)) < tolerance);
    if (row) row.lines.push(line);
    else rows.push({ y: centre(line), lines: [line] });
  }
  for (const row of rows) row.lines.sort((a, b) => a.bbox[0] - b.bbox[0]);
  return rows;
}

/** Join a stem's segments; a wide horizontal gap inside a row is the blank to fill in. */
function joinStem(lines: OcrLine[]): string {
  return rowsOf(lines)
    .map((row) =>
      row.lines.reduce((text, line, index) => {
        const previous = row.lines[index - 1];
        const gap = previous ? line.bbox[0] - previous.bbox[2] : 0;
        return text + (previous && gap > 0.05 ? '（　　）' : '') + line.text.trim();
      }, ''),
    )
    .join('');
}

/** Remove a question number that OCR merged into the start of a line ("300A「…" -> "A「…"). */
function withoutMergedNumber(line: OcrLine, number: number): OcrLine {
  const text = line.text.trim();
  const prefix = String(number);
  const merged = line.bbox[0] < NUMBER_BOX_RIGHT && text.startsWith(prefix) && !/^\d/u.test(text.slice(prefix.length));
  return merged ? { ...line, text: text.slice(prefix.length) } : line;
}

/**
 * On answer pages the number box, the answer digit and the sentence can merge into one line,
 * and OCR sometimes keeps only the tail of the number ("54今朝…" for question 25, answer 4).
 * Strip the whole number or its tail when an answer digit follows.
 */
function withoutMergedNumberBeforeAnswer(line: OcrLine, number: number): string {
  const text = toHalfWidth(line.text.trim());
  if (line.bbox[0] >= NUMBER_BOX_RIGHT) return text;
  const digits = String(number);
  for (let start = 0; start < digits.length; start++) {
    const tail = digits.slice(start);
    if (text.startsWith(tail) && /^\s*[1-4]\s*\D/u.test(text.slice(tail.length))) return text.slice(tail.length).trimStart();
  }
  return text;
}

/** Split an option that swallowed the next one ("まちあわせましょう2つれていきましょう"). */
function splitMergedOption(slot: OptionSlot): OptionSlot[] {
  const match = /^(.+?)\s*([2-4])\s*([^\d\s].*)$/u.exec(toHalfWidth(slot.text));
  if (!match?.[1] || !match[2] || !match[3] || Number(match[2]) !== slot.number + 1) return [slot];
  return [
    { ...slot, text: match[1].trim() },
    { ...slot, number: Number(match[2]), text: match[3].trim() },
  ];
}

interface OptionSlot {
  number: number;
  text: string;
  y: number;
  lines: OcrLine[];
}

/**
 * Find a question's options by their printed numbers (alone, or prefixed to the option
 * text) in the fixed option columns. A number OCR missed is recovered from the regular
 * spacing of a vertical list.
 */
function parseOptions(lines: OcrLine[], count: number): { slots: OptionSlot[]; flags: string[] } {
  const slots: OptionSlot[] = [];
  const used = new Set<OcrLine>();
  for (const line of [...lines].sort((a, b) => a.bbox[1] - b.bbox[1] || a.bbox[0] - b.bbox[0])) {
    const match = /^([1-4])\s*(.*)$/u.exec(toHalfWidth(line.text.trim()));
    const number = Number(match?.[1]);
    if (!match || !inMarkerColumn(line) || number > count || slots.some((slot) => slot.number === number)) continue;
    let text = match[2]?.trim() ?? '';
    const members = [line];
    if (!text) {
      // A separate number box: the option text is the nearest line to its right on the same row.
      const neighbour = lines
        .filter((other) => !used.has(other) && other !== line && other.bbox[0] > line.bbox[0] && Math.abs(centre(other) - centre(line)) < 0.012)
        .sort((a, b) => a.bbox[0] - b.bbox[0])[0];
      if (neighbour && !/^[1-4]/u.test(toHalfWidth(neighbour.text.trim()))) {
        text = neighbour.text.trim();
        members.push(neighbour);
      }
    }
    members.forEach((member) => used.add(member));
    for (const part of splitMergedOption({ number, text, y: centre(line), lines: members })) {
      if (!slots.some((slot) => slot.number === part.number)) slots.push(part);
    }
  }

  const flags: string[] = [];
  const missing = Array.from({ length: count }, (_, index) => index + 1).filter((number) => !slots.some((slot) => slot.number === number));
  const known = [...slots].sort((a, b) => a.number - b.number);
  const first = known[0];
  const last = known.at(-1);
  const isVerticalList = known.length >= 2 && known.every((slot, index) => index === 0 || slot.y > (known[index - 1]?.y ?? 0) + 0.01);
  if (missing.length > 0 && isVerticalList && first && last && last.number > first.number) {
    const spacing = (last.y - first.y) / (last.number - first.number);
    for (const number of missing) {
      const expectedY = first.y + (number - first.number) * spacing;
      const candidate = lines.find(
        (line) => !used.has(line) && line.bbox[0] >= 0.272 && line.bbox[0] <= 0.36 && Math.abs(centre(line) - expectedY) < spacing * 0.4,
      );
      if (candidate) {
        used.add(candidate);
        slots.push({ number, text: candidate.text.trim(), y: centre(candidate), lines: [candidate] });
        flags.push('option-number-inferred');
      }
    }
  }
  if (slots.length !== count || slots.some((slot) => !slot.text)) flags.push('options-incomplete');
  return { slots: slots.sort((a, b) => a.number - b.number), flags };
}

// ---------------------------------------------------------------------------
// Days 1-6
// ---------------------------------------------------------------------------

interface ParsedQuestion {
  printedNumber?: number;
  stem: string;
  options: string[];
  flags: string[];
}

function parseQuestionBand(page: OcrPage, band: [number, number], expectedNumber: number): ParsedQuestion {
  const lines = page.lines.filter((line) => inBand(line, band) && !isFurigana(line) && !isCategoryLabel(line) && !isCheckbox(line));
  const numberLine = lines.find((line) => /^\d{1,3}$/u.test(line.text.trim()) && line.bbox[0] > 0.2 && line.bbox[0] < NUMBER_BOX_RIGHT);
  const content = lines.filter((line) => line !== numberLine);
  const { slots, flags } = parseOptions(content, 4);
  const optionLines = new Set(slots.flatMap((slot) => slot.lines));
  const firstOptionY = slots.length ? Math.min(...slots.map((slot) => slot.y)) : band[1];
  const stemLines = content.filter((line) => !optionLines.has(line) && centre(line) < firstOptionY - 0.008);
  const mergedNumber = stemLines.some((line) => withoutMergedNumber(line, expectedNumber) !== line);
  if (stemLines.length === 0) flags.push('stem-missing');
  return {
    printedNumber: numberLine ? Number(numberLine.text.trim()) : mergedNumber ? expectedNumber : undefined,
    stem: joinStem(stemLines.map((line) => withoutMergedNumber(line, expectedNumber))),
    options: slots.map((slot) => slot.text),
    flags,
  };
}

interface ParsedAnswer {
  answer?: number;
  sentence?: string;
  translation?: string;
  /** All text in the answer box (including furigana), for cross-checking. */
  allText: string;
  /** The sentence read in kana: each kanji run replaced by the furigana printed under it. */
  reading: string;
}

const HAN = /\p{Script=Han}/u;

/**
 * Rebuild the kana reading of a printed line. Characters are full-width, so each one
 * occupies an equal share of the line's width; furigana (printed below the line in this
 * book) belongs to the kanji run it sits under.
 */
function readingOfLine(line: OcrLine, text: string, furigana: OcrLine[]): string {
  const characters = Array.from(text);
  const width = (line.bbox[2] - line.bbox[0]) / Math.max(1, Array.from(line.text.trim()).length);
  const offset = Array.from(line.text.trim()).length - characters.length; // characters stripped from the start
  const under = furigana.filter((ruby) => ruby.bbox[1] > line.bbox[1] && ruby.bbox[1] < line.bbox[3] + 0.02);
  let reading = '';
  for (let index = 0; index < characters.length; ) {
    if (!HAN.test(characters[index] ?? '')) {
      reading += characters[index];
      index++;
      continue;
    }
    let end = index;
    while (end < characters.length && HAN.test(characters[end] ?? '')) end++;
    const from = line.bbox[0] + (index + offset) * width - width / 2;
    const to = line.bbox[0] + (end + offset) * width + width / 2;
    const ruby = under
      .filter((candidate) => (candidate.bbox[0] + candidate.bbox[2]) / 2 >= from && (candidate.bbox[0] + candidate.bbox[2]) / 2 <= to)
      .sort((a, b) => a.bbox[0] - b.bbox[0])
      .map((candidate) => candidate.text.trim())
      .join('');
    reading += ruby || characters.slice(index, end).join('');
    index = end;
  }
  return reading;
}

const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/iu;

function parseAnswerBand(page: OcrPage, band: [number, number], expectedNumber: number): ParsedAnswer {
  const all = page.lines.filter((line) => inBand(line, band));
  const main = all.filter((line) => !isFurigana(line) && !isCategoryLabel(line)).sort((a, b) => a.bbox[1] - b.bbox[1]);
  // Notes such as "OK 有名な店のわりには" (another accepted answer) start with Latin letters; the sentence never does.
  const isSentenceLine = (line: OcrLine) => line.bbox[0] > 0.15 && line.bbox[0] < 0.3 && HAS_CJK.test(line.text) && !/^[A-Za-z]/u.test(line.text.trim());
  const first = main.find(isSentenceLine);
  const allText = all.map((line) => line.text).join('');
  if (!first) return { allText, reading: '' };

  // English translation: the first Latin line under the sentence (the Vietnamese one follows it).
  // Searched among all lines: furigana is never Latin, but in the smaller type of the N3–N1
  // books the translation is as short as furigana.
  const isEnglish = (line: OcrLine) => /^[A-Za-z"'“(]/u.test(line.text.trim()) && !VIETNAMESE.test(line.text) && !HAS_CJK.test(line.text);
  const translation = all.find((line) => line.bbox[1] > first.bbox[1] && line.bbox[1] < first.bbox[1] + 0.08 && isEnglish(line));
  // A dialogue's translation continues with speaker B on the next line.
  const reply =
    translation && /^A\s*:/u.test(translation.text.trim())
      ? all.find((line) => line.bbox[1] > translation.bbox[1] && line.bbox[1] < translation.bbox[3] + 0.02 && /^B\s*:/u.test(line.text.trim()) && isEnglish(line))
      : undefined;
  const translationText = [translation, reply].flatMap((line) => (line ? [line.text.trim()] : [])).join(' ');
  // A dialogue answer spans several printed lines, all above the translation.
  const sentenceLines = main.filter((line) => isSentenceLine(line) && line.bbox[1] >= first.bbox[1] && line.bbox[1] < (translation?.bbox[1] ?? first.bbox[3] + 0.005));

  let answer: number | undefined;
  const firstText = withoutMergedNumberBeforeAnswer(first, expectedNumber);
  const leading = /^([1-4])\s*/u.exec(firstText);
  const firstSentenceText = leading ? firstText.slice(leading[0].length) : firstText;
  if (leading?.[1]) {
    answer = Number(leading[1]);
  } else {
    const digit = all.find(
      (line) => /^[1-4１-４]$/u.test(line.text.trim()) && line.bbox[0] > 0.2 && line.bbox[0] < 0.25 && Math.abs(centre(line) - centre(first)) < 0.012,
    );
    // Otherwise the number box and the answer digit may form one line of their own ("36 4", "2061").
    const numberBox = new RegExp(`^${expectedNumber}\\s*([1-4])$`, 'u');
    const box = all
      .filter((line) => line.bbox[0] < NUMBER_BOX_RIGHT && Math.abs(centre(line) - centre(first)) < 0.012)
      .map((line) => numberBox.exec(toHalfWidth(line.text.trim())))
      .find(Boolean);
    const found = digit ? toHalfWidth(digit.text.trim()) : box?.[1];
    if (found) answer = Number(found);
  }

  const furigana = all.filter(isFurigana);
  const texts = sentenceLines.map((line) => (line === first ? firstSentenceText : line.text.trim()));
  const reading = sentenceLines.map((line, index) => readingOfLine(line, texts[index] ?? '', furigana)).join('');
  return { answer, sentence: texts.join(''), translation: translationText || undefined, allText, reading };
}

/**
 * The correct option must appear on the answer page: in the full sentence, in its kana
 * reading (kanji replaced by their furigana, so 貸して reads かして), or among the furigana.
 */
function answerConfirmed(option: string, answer: ParsedAnswer): boolean {
  const target = compactCjk(option);
  if (!target) return false;
  return (
    compactCjk(answer.allText).includes(target) ||
    canonicalKana(answer.reading).includes(canonicalKana(option)) ||
    canonicalKana(answer.allText).includes(canonicalKana(option))
  );
}

// ---------------------------------------------------------------------------
// Day 7
// ---------------------------------------------------------------------------

interface ReviewQuestion {
  printedNumber: number;
  stem: string;
  options: string[];
  reviewOf?: number;
  band: [number, number];
  category: Shin500Category;
  flags: string[];
}

function parseReviewPage(page: OcrPage): ReviewQuestion[] {
  const questions: ReviewQuestion[] = [];
  BANDS.forEach((band, bandIndex) => {
    const lines = page.lines.filter((line) => inBand(line, band) && !isFurigana(line) && !isCategoryLabel(line) && !isCheckbox(line));
    const numberLines = lines
      .filter((line) => /^\d{2,3}/u.test(line.text.trim()) && line.bbox[0] > 0.2 && line.bbox[0] < NUMBER_BOX_RIGHT)
      .sort((a, b) => a.bbox[1] - b.bbox[1]);
    numberLines.forEach((numberLine, index) => {
      const printedNumber = Number(/^\d{2,3}/u.exec(numberLine.text.trim())?.[0]);
      const next = numberLines[index + 1];
      const region: [number, number] = [numberLine.bbox[1] - 0.008, next ? next.bbox[1] - 0.008 : band[1]];
      const inRegion = lines.filter((line) => line.bbox[1] >= region[0] && line.bbox[1] < region[1]);
      const { slots, flags } = parseOptions(inRegion.filter((line) => line !== numberLine), 2);
      const optionLines = new Set(slots.flatMap((slot) => slot.lines));
      const stemLines = inRegion
        .filter((line) => !optionLines.has(line))
        .map((line) => (line === numberLine ? withoutMergedNumber(line, printedNumber) : line))
        .filter((line) => line.text.trim() && !/^\d{2,3}$/u.test(line.text.trim()));
      const rawStem = joinStem(stemLines);
      const reference = /→\s*(\d{1,3})\s*$/u.exec(rawStem);
      questions.push({
        printedNumber,
        stem: rawStem.replace(/→\s*\d*\s*$/u, '').trim(),
        options: slots.map((slot) => slot.text),
        reviewOf: reference ? Number(reference[1]) : undefined,
        band: region,
        category: CATEGORIES[bandIndex] ?? 'moji',
        flags,
      });
    });
  });
  return questions;
}

/**
 * Answers printed in a page footer: "前のページのこたえ 91 2 92 1 ...". Each question number
 * is paired with the digit printed right after it, by position, so a digit OCR missed
 * leaves only that one answer unknown instead of shifting all the others.
 */
function parseFooterAnswers(page: OcrPage | undefined): Map<number, number> {
  const answers = new Map<number, number>();
  const marker = page?.lines.find((line) => FOOTER_ANSWERS.test(line.text));
  if (!page || !marker) return answers;
  const tokens = page.lines
    .filter((line) => line !== marker && Math.abs(centre(line) - centre(marker)) < 0.012 && line.bbox[0] > marker.bbox[2] - 0.01)
    .flatMap((line) => {
      const pieces = toHalfWidth(line.text).replace(/[^\d\s]/gu, ' ').trim().split(/\s+/u).filter(Boolean);
      const width = (line.bbox[2] - line.bbox[0]) / Math.max(1, pieces.length);
      return pieces.map((piece, index) => ({ value: piece, x: line.bbox[0] + index * width }));
    })
    .sort((a, b) => a.x - b.x);
  tokens.forEach((token, index) => {
    if (token.value.length < 2) return;
    const next = tokens[index + 1];
    if (next && next.value.length === 1 && next.x - token.x < 0.045 && (next.value === '1' || next.value === '2')) {
      answers.set(Number(token.value), Number(next.value));
    }
  });
  return answers;
}

/**
 * The first question number of a day 1-6 page as printed, when at least two of its three
 * boxes agree on it and it is a valid page start in this week. A page whose day tab OCR
 * missed would otherwise be counted as part of the previous day and shift every number after it.
 */
function printedFirstNumber(page: OcrPage, expected: number, week: number): number | undefined {
  const votes = new Map<number, number>();
  BANDS.forEach((band, bandIndex) => {
    const printed = parseQuestionBand(page, band, expected + bandIndex).printedNumber;
    if (printed !== undefined) votes.set(printed - bandIndex, (votes.get(printed - bandIndex) ?? 0) + 1);
  });
  const weekStart = (week - 1) * QUESTIONS_PER_WEEK + 1;
  const [first] = [...votes].find(([candidate, count]) => count >= 2 && candidate >= weekStart && candidate < weekStart + FIRST_REVIEW_NUMBER - 1 && (candidate - weekStart) % 3 === 0) ?? [];
  return first;
}

// ---------------------------------------------------------------------------

export function parseShin500(pages: OcrPage[]): Shin500Item[] {
  const infos = pages.map(describePage);
  const start = infos.findIndex((info) => info.kind === 'question' && info.day === 1 && info.week === 1);
  if (start < 0) return [];

  const items: Shin500Item[] = [];
  let week = 1;
  let day = 1;
  let pageInDay = 0;

  for (let index = start; index < infos.length; index++) {
    const info = infos[index]!;
    if (info.kind !== 'question') continue;
    if (info.week && info.week !== week) {
      week = info.week;
      day = info.day ?? 1;
      pageInDay = 0;
    } else if (info.day && info.day !== day) {
      day = info.day;
      pageInDay = 0;
    }

    if (day <= 6) {
      const answerInfo = infos[index + 1]?.kind === 'answer' ? infos[index + 1] : undefined;
      const expectedFirst = (week - 1) * QUESTIONS_PER_WEEK + (day - 1) * QUESTIONS_PER_DAY + pageInDay * 3 + 1;
      const firstNumber = printedFirstNumber(info.page, expectedFirst, week) ?? expectedFirst;
      const offsetInWeek = firstNumber - ((week - 1) * QUESTIONS_PER_WEEK + 1);
      day = Math.floor(offsetInWeek / QUESTIONS_PER_DAY) + 1;
      pageInDay = (offsetInWeek % QUESTIONS_PER_DAY) / 3 + 1;
      BANDS.forEach((band, bandIndex) => {
        const number = firstNumber + bandIndex;
        const question = parseQuestionBand(info.page, band, number);
        const flags = [...question.flags];
        if (question.printedNumber !== undefined && question.printedNumber !== number) flags.push(`printed-number-${question.printedNumber}`);
        const parsed = answerInfo ? parseAnswerBand(answerInfo.page, band, number) : undefined;
        if (!parsed?.answer) flags.push('answer-missing');
        const correctOption = parsed?.answer ? question.options[parsed.answer - 1] : undefined;
        if (correctOption && parsed && !answerConfirmed(correctOption, parsed)) flags.push('answer-not-confirmed-on-answer-page');
        items.push({
          number,
          week,
          day,
          category: CATEGORIES[bandIndex] ?? 'moji',
          stem: question.stem,
          options: question.options,
          answer: parsed?.answer ?? 0,
          questionPage: info.page.page,
          questionBand: band,
          answerPage: answerInfo?.page.page,
          answerBand: band,
          sentence: parsed?.sentence,
          translation: parsed?.translation,
          flags,
        });
      });
    } else {
      const answers = parseFooterAnswers(infos[index + 1]?.page);
      const firstReview = (week - 1) * QUESTIONS_PER_WEEK + FIRST_REVIEW_NUMBER;
      for (const question of parseReviewPage(info.page)) {
        const flags = [...question.flags];
        if (question.printedNumber < firstReview || question.printedNumber > week * QUESTIONS_PER_WEEK) flags.push('number-out-of-range');
        const answer = answers.get(question.printedNumber);
        if (!answer) flags.push('answer-missing');
        items.push({
          number: question.printedNumber,
          week,
          day: 7,
          category: question.category,
          stem: question.stem,
          options: question.options,
          answer: answer ?? 0,
          questionPage: info.page.page,
          questionBand: question.band,
          reviewOf: question.reviewOf,
          flags,
        });
      }
    }
  }
  return items;
}
