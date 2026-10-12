import { describe, expect, it } from 'vitest';
import type { OcrLine, OcrPage } from '../ocr.ts';
import { MODEL_TEST, optionIds, parseWorkbookKey } from './workbook.ts';

const line = (text: string, x: number, y: number): OcrLine => ({ text, score: 1, bbox: [x, y, x + 0.2, y + 0.015] });
const page = (number: number, lines: OcrLine[]): OcrPage => ({ source: 'test', page: number, method: 'ocr', lines });
const header = line('练习册听力文本及参考答案', 0.1, 0.03);

describe('parseWorkbookKey', () => {
  const pages = [
    page(1, [
      header,
      line('第11课', 0.1, 0.11),
      line('一、听力', 0.1, 0.16),
      line('第二部分', 0.4, 0.2),
      line('6.男：你几点去？', 0.1, 0.25),
      line('女：九点。', 0.13, 0.27),
      line('参考答案', 0.1, 0.45),
      // Left column: listening, then reading; the right column continues reading.
      line('一、听力', 0.1, 0.49),
      line('26-30: F C A B E', 0.55, 0.49),
      line('1-5: × √ × × ×', 0.14, 0.51),
      line('二、阅读', 0.1, 0.57),
      line('16-20:√ × √ ×', 0.14, 0.59),
      line('21-25: A D C B E', 0.14, 0.61),
    ]),
    page(2, [header, line('HSK（一级）模拟试卷', 0.2, 0.11), line('参考答案', 0.1, 0.3), line('一、听力', 0.1, 0.33), line('1-2: √ ×', 0.14, 0.35)]),
  ];
  const [lesson, test] = parseWorkbookKey(pages);

  it('reads the right column as a continuation of the left one', () => {
    expect(lesson!.ranges).toContainEqual({ section: 'reading', from: 26, to: 30, answers: ['F', 'C', 'A', 'B', 'E'] });
    expect(lesson!.ranges).toContainEqual({ section: 'listening', from: 1, to: 5, answers: ['✗', '✓', '✗', '✗', '✗'] });
  });

  it('rejects a range with a missing answer instead of guessing', () => {
    expect(lesson!.ranges.some((range) => range.from === 16)).toBe(false);
    expect(lesson!.rejected.map((range) => [range.section, range.from, range.to])).toEqual([['reading', 16, 20]]);
  });

  it('collects listening scripts by question', () => {
    expect(lesson!.scripts.get(6)).toEqual(['男：你几点去？', '女：九点。']);
  });

  it('finds a lesson heading set above the body area', () => {
    const highHeading = [page(3, [header, line('第20课 我被他影响了', 0.35, 0.06), line('参考答案', 0.1, 0.4), line('一、听力', 0.1, 0.43), line('1-2: √ ×', 0.14, 0.45)])];
    expect(parseWorkbookKey(highHeading).map((key) => key.lesson)).toEqual([20]);
  });

  it('keys the model test separately', () => {
    expect(test!.lesson).toBe(MODEL_TEST);
    expect(test!.ranges).toEqual([{ section: 'listening', from: 1, to: 2, answers: ['✓', '✗'] }]);
  });
});

describe('optionIds', () => {
  it('uses judgements or letters up to the highest one used', () => {
    expect(optionIds(['✓', '✗'])).toEqual(['✓', '✗']);
    expect(optionIds(['B', 'A'])).toEqual(['A', 'B', 'C']);
    // Every alternative must be offered: "F/G" accepts G too.
    expect(optionIds(['E', 'F/G'])).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });
});
