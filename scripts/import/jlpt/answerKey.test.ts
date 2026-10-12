import { describe, expect, it } from 'vitest';
import type { OcrLine, OcrPage } from '../ocr.ts';
import { parseAnswerKey, validateAnswerKey } from './answerKey.ts';

/** A text-layer row: cells at the given x positions, all at height y. */
function row(y: number, cells: Array<[string, number]>): OcrLine[] {
  return cells.map(([text, x]) => ({ text, score: 1, bbox: [x, y, x + 0.03, y + 0.015] }));
}

function page(lines: OcrLine[]): OcrPage {
  return { source: 'test', page: 1, method: 'text-layer', lines };
}

describe('parseAnswerKey', () => {
  it('reads the combined N2/N1 language section with two-digit 問題 numbers and ignores the page footer', () => {
    const items = parseAnswerKey([
      page([
        ...row(0.13, [['●言語知識（文字・語彙・文法）・読解', 0.11]]),
        ...row(0.2, [['問題9', 0.124], ['49', 0.212], ['50', 0.272]]),
        ...row(0.23, [['4', 0.217], ['1', 0.278]]),
        ...row(0.3, [['問題10', 0.119], ['51', 0.212]]),
        ...row(0.33, [['2', 0.217]]),
        ...row(0.97, [['56', 0.94], ['56', 0.94]]),
      ]),
    ]);

    expect(items).toEqual([
      { part: 'language', mondai: 9, number: '49', answer: 4 },
      { part: 'language', mondai: 9, number: '50', answer: 1 },
      { part: 'language', mondai: 10, number: '51', answer: 2 },
    ]);
    expect(validateAnswerKey(items)).toEqual([]);
  });

  it('splits a listening question with 質問1 and 質問2 into two answers', () => {
    const items = parseAnswerKey([
      page([
        ...row(0.33, [['●聴解', 0.11]]),
        ...row(0.73, [['問題５', 0.124], ['1', 0.219], ['2', 0.279], ['3', 0.37]]),
        ...row(0.75, [['質問1 質問2', 0.318]]),
        ...row(0.78, [['２', 0.215], ['２', 0.275], ['１', 0.336], ['４', 0.396]]),
      ]),
    ]);

    expect(items.map((item) => [item.number, item.answer])).toEqual([
      ['1', 2],
      ['2', 2],
      ['3-1', 1],
      ['3-2', 4],
    ]);
  });

  it('keeps vocabulary and grammar & reading apart below N2', () => {
    const items = parseAnswerKey([
      page([
        ...row(0.1, [['●言語知識（文字・語彙）', 0.11]]),
        ...row(0.15, [['問題1', 0.124], ['1', 0.212]]),
        ...row(0.18, [['3', 0.217]]),
        ...row(0.25, [['●言語知識（文法）・読解', 0.11]]),
        ...row(0.3, [['問題1', 0.124], ['1', 0.212]]),
        ...row(0.33, [['2', 0.217]]),
      ]),
    ]);

    expect(items.map((item) => item.part)).toEqual(['vocab', 'grammar-reading']);
  });
});
