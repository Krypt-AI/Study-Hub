/**
 * Splits an official JLPT listening script (聴解スクリプト) into one transcript per question.
 * Furigana (half-height text above kanji) is dropped; the script's own headings
 * 問題N / 例 / N番 delimit the questions.
 */
import type { OcrLine, OcrPage } from '../ocr.ts';

export interface Transcript {
  mondai: number;
  /** 0 for the example (例). */
  question: number;
  lines: string[];
}

const MIN_MAIN_TEXT_HEIGHT = 0.012;
const toHalfWidth = (text: string) => text.replace(/[０-９]/gu, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));

function joinRows(lines: OcrLine[]): string[] {
  const rows: Array<{ y: number; parts: OcrLine[] }> = [];
  for (const line of [...lines].sort((a, b) => a.bbox[1] - b.bbox[1])) {
    const row = rows.find((candidate) => Math.abs(candidate.y - line.bbox[1]) < 0.004);
    if (row) row.parts.push(line);
    else rows.push({ y: line.bbox[1], parts: [line] });
  }
  return rows.map((row) =>
    row.parts
      .sort((a, b) => a.bbox[0] - b.bbox[0])
      .map((part) => part.text)
      .join('')
      .trim(),
  );
}

export function parseListeningScript(pages: OcrPage[]): Transcript[] {
  const transcripts: Transcript[] = [];
  let mondai = 0;
  let current: Transcript | undefined;
  for (const page of pages) {
    const mainText = page.lines.filter((line) => line.bbox[3] - line.bbox[1] >= MIN_MAIN_TEXT_HEIGHT && line.bbox[1] > 0.06);
    for (const row of joinRows(mainText)) {
      const normalized = toHalfWidth(row);
      const mondaiHeading = /^問題(\d)$/u.exec(normalized);
      if (mondaiHeading) {
        mondai = Number(mondaiHeading[1]);
        current = undefined;
        continue;
      }
      // Two-digit headings are set with a space: "10 番".
      const questionHeading = /^(?:(例)|(\d{1,2})\s*番)$/u.exec(normalized);
      if (questionHeading && mondai > 0) {
        current = { mondai, question: questionHeading[1] ? 0 : Number(questionHeading[2]), lines: [] };
        transcripts.push(current);
        continue;
      }
      if (current && row && !/^聴解スクリプト$|^（Ｍ：男性/u.test(row) && !/^\d+$/u.test(normalized)) current.lines.push(row);
    }
  }
  return transcripts;
}
