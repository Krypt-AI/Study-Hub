/**
 * Parses an official JLPT sample-test answer key (正答表) from its text layer:
 * a "問題N" row of question numbers followed by a row of answers at the same x positions.
 * N3 and below have separate vocabulary and grammar & reading sections; N2 and N1 combine
 * them into one language-knowledge & reading section ('language').
 */
import type { OcrLine, OcrPage } from '../ocr.ts';

export type TestPart = 'vocab' | 'grammar-reading' | 'language' | 'listening';

export interface AnswerKeyItem {
  part: TestPart;
  mondai: number;
  /**
   * Printed question number; "0" is the listening example (例). A question with two
   * sub-questions (質問1, 質問2) becomes "3-1" and "3-2".
   */
  number: string;
  answer: number;
}

const FULL_WIDTH_DIGITS = /[０-９]/gu;
/** Rows below this are the page footer (page numbers), not part of the key. */
const FOOTER_TOP = 0.95;
/** Horizontal distance between neighbouring answer columns. */
const COLUMN_PITCH = 0.06;

const toHalfWidth = (text: string) => text.replace(FULL_WIDTH_DIGITS, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));

interface Row {
  y: number;
  cells: OcrLine[];
  text: string;
}

function groupRows(lines: OcrLine[]): Row[] {
  const rows: Row[] = [];
  for (const line of [...lines].sort((a, b) => a.bbox[1] - b.bbox[1])) {
    const row = rows.find((candidate) => Math.abs(candidate.y - line.bbox[1]) < 0.006);
    if (row) row.cells.push(line);
    else rows.push({ y: line.bbox[1], cells: [line], text: '' });
  }
  for (const row of rows) {
    row.cells.sort((a, b) => a.bbox[0] - b.bbox[0]);
    row.text = row.cells.map((cell) => cell.text).join('');
  }
  return rows;
}

function partOf(text: string): TestPart | undefined {
  if (/聴解/u.test(text)) return 'listening';
  const vocabulary = /文字/u.test(text) && /語彙/u.test(text);
  if (/文法/u.test(text)) return vocabulary ? 'language' : 'grammar-reading';
  if (vocabulary) return 'vocab';
  return undefined;
}

/** The last question of a "質問1 質問2" row has two answers: split its number in two. */
function splitSubQuestions(numbers: Array<{ text: string; x: number }>): Array<{ text: string; x: number }> {
  const last = numbers.at(-1);
  if (!last) return numbers;
  return [
    ...numbers.slice(0, -1),
    { text: `${last.text}-1`, x: last.x - COLUMN_PITCH / 2 },
    { text: `${last.text}-2`, x: last.x + COLUMN_PITCH / 2 },
  ];
}

/** Cells of a row split into single tokens (full-width digit runs become one token per digit). */
function tokens(row: Row): Array<{ text: string; x: number }> {
  return row.cells.flatMap((cell) => {
    const text = toHalfWidth(cell.text.trim());
    if (/^\d{2,}$/u.test(text) && /[０-９]{2,}/u.test(cell.text)) {
      const width = (cell.bbox[2] - cell.bbox[0]) / text.length;
      return Array.from(text).map((digit, index) => ({ text: digit, x: cell.bbox[0] + width * index }));
    }
    return text.split(/\s+/u).filter(Boolean).map((piece) => ({ text: piece, x: cell.bbox[0] }));
  });
}

export function parseAnswerKey(pages: OcrPage[]): AnswerKeyItem[] {
  const items: AnswerKeyItem[] = [];
  let part: TestPart | undefined;
  let mondai = 0;
  let pendingNumbers: Array<{ text: string; x: number }> | undefined;

  for (const page of pages) {
    for (const row of groupRows(page.lines)) {
      if (row.y > FOOTER_TOP) continue;
      const newPart = partOf(row.text);
      if (newPart) {
        part = newPart;
        continue;
      }
      if (!part) continue;
      if (/質問/u.test(row.text)) {
        if (pendingNumbers) pendingNumbers = splitSubQuestions(pendingNumbers);
        continue;
      }
      const rowTokens = tokens(row);
      const header = rowTokens[0]?.text.match(/^問題(\d{1,2})$/u);
      if (header) {
        mondai = Number(header[1]);
        pendingNumbers = rowTokens.slice(1);
        continue;
      }
      const allNumeric = rowTokens.length > 0 && rowTokens.every((token) => /^(\d{1,2}|例)$/u.test(token.text));
      if (!allNumeric) continue;
      if (!pendingNumbers || pendingNumbers.length === 0) {
        pendingNumbers = rowTokens; // a continuation row of question numbers
        continue;
      }
      // Answers row: align each answer with the nearest question number by x position.
      for (const number of pendingNumbers) {
        const answer = rowTokens.reduce((best, token) => (Math.abs(token.x - number.x) < Math.abs(best.x - number.x) ? token : best));
        items.push({ part, mondai, number: number.text === '例' ? '0' : number.text, answer: Number(answer.text) });
      }
      pendingNumbers = undefined;
    }
  }
  return items;
}

/** Problems with a parsed key: answers outside 1-4, or gaps in the question numbering. */
export function validateAnswerKey(items: AnswerKeyItem[]): string[] {
  const problems: string[] = [];
  for (const item of items) {
    if (item.answer < 1 || item.answer > 4) problems.push(`${item.part} 問題${item.mondai} #${item.number}: answer ${item.answer} is not 1-4`);
  }
  for (const part of ['vocab', 'grammar-reading', 'language'] as const) {
    const numbers = items.filter((item) => item.part === part).map((item) => Number(item.number));
    numbers.forEach((number, index) => {
      if (index > 0 && number !== (numbers[index - 1] ?? 0) + 1) problems.push(`${part}: question ${number} follows ${numbers[index - 1]}`);
    });
  }
  return problems;
}
