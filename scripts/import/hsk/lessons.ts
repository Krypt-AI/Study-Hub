/**
 * Finds the lessons of an HSK Standard Course textbook. A lesson opens with a title
 * block at the top of the page (pinyin, the Chinese title in a large font, the English
 * title) next to a large lesson number. OCR misses one or the other on some pages, so
 * a page counts as a lesson opening when either signal is present.
 */
import { parsePinyin } from '../../../src/domain/evaluation/pinyin.ts';
import { centerY, HAS_CJK, lineHeight, type OcrPage } from '../ocr.ts';

export interface LessonOutline {
  number: number;
  titleZh: string;
  titlePinyin: string;
  titleEn: string;
  firstPage: number;
  lastPage: number;
  flags: string[];
}

const TOP_REGION = 0.17;
const TITLE_MIN_HEIGHT = 0.03;
const BIG_NUMBER_MIN_HEIGHT = 0.045;
const LATIN = /[A-Za-z]/u;
/** Running side tabs (the lesson title set vertically) sit in the right margin. */
const SIDE_TAB_LEFT = 0.9;
/** Every lesson starts with its warm-up box just below the title block. */
const WARM_UP = /^(热身|Warm-up)/u;
const WARM_UP_REGION = 0.25;

interface Opening {
  page: number;
  printedNumber?: number;
  hasTitlePattern: boolean;
  zh: string;
  pinyin: string;
  en: string;
  flags: string[];
}

function findOpening(page: OcrPage): Opening | undefined {
  const top = page.lines.filter((line) => line.bbox[1] < TOP_REGION && line.bbox[0] < SIDE_TAB_LEFT).sort((a, b) => a.bbox[1] - b.bbox[1]);
  const bigNumber = top.find((line) => /^\d{1,2}$/u.test(line.text.trim()) && lineHeight(line) >= BIG_NUMBER_MIN_HEIGHT);
  const zh = top.find((line) => HAS_CJK.test(line.text) && !LATIN.test(line.text) && lineHeight(line) >= TITLE_MIN_HEIGHT);
  if (!zh) return undefined;

  const latinAbove = top.filter((line) => LATIN.test(line.text) && !HAS_CJK.test(line.text) && centerY(line) < centerY(zh));
  const en = top.find(
    (line) => /[A-Za-z]{3}/u.test(line.text) && !HAS_CJK.test(line.text) && centerY(line) > centerY(zh) && parsePinyin(line.text) === null,
  );
  // From HSK 5 on, titles have no pinyin line; the warm-up box below them marks the opening instead.
  const opensWithWarmUp = page.lines.some((line) => line.bbox[1] < WARM_UP_REGION && WARM_UP.test(line.text.trim()));
  const hasTitlePattern = (latinAbove.some((line) => parsePinyin(line.text) !== null) || opensWithWarmUp) && en !== undefined;
  if (!hasTitlePattern && !bigNumber) return undefined;

  const flags: string[] = [];
  const pinyinLines = [...latinAbove].sort((a, b) => (Math.abs(a.bbox[1] - b.bbox[1]) < 0.01 ? a.bbox[0] - b.bbox[0] : a.bbox[1] - b.bbox[1]));
  if (pinyinLines.some((line) => parsePinyin(line.text) === null)) flags.push('title-pinyin-unverified');
  if (!en) flags.push('missing-english-title');
  return {
    page: page.page,
    printedNumber: bigNumber ? Number(bigNumber.text.trim()) : undefined,
    hasTitlePattern,
    zh: zh.text.trim(),
    pinyin: pinyinLines.map((line) => line.text.trim()).join(' '),
    en: en?.text.trim() ?? '',
    flags,
  };
}

/**
 * Keep candidates that open the next lesson: a full title block, or a large printed number
 * equal to the expected lesson. Side tabs repeat the current title on later pages, so a
 * candidate with the same Chinese title as the previous lesson is a continuation.
 */
function selectOpenings(candidates: Opening[], firstNumber: number): Opening[] {
  // Titles are compared by their characters only: OCR reads the quotes of a side tab
  // differently from the title block (“病” vs 「病」).
  const hanOnly = (title: string | undefined) => title?.replace(/[^\p{Script=Han}]/gu, '');
  const accepted: Opening[] = [];
  for (const candidate of candidates) {
    const expected = firstNumber + accepted.length;
    if (hanOnly(candidate.zh) === hanOnly(accepted.at(-1)?.zh)) continue;
    if (candidate.hasTitlePattern || candidate.printedNumber === expected) accepted.push(candidate);
  }
  return accepted;
}

/**
 * @param pages all OCR pages of the textbook
 * @param endPage last page belonging to lessons (the page before the vocabulary index)
 * @param firstNumber number of the volume's first lesson (volume B continues A's numbering)
 */
export function findLessons(pages: OcrPage[], endPage: number, firstNumber = 1): LessonOutline[] {
  const openings = selectOpenings(pages.filter((page) => page.page <= endPage).flatMap((page) => findOpening(page) ?? []), firstNumber);
  return openings.map((opening, index) => {
    const number = firstNumber + index;
    const flags = [...opening.flags];
    if (opening.printedNumber !== undefined && opening.printedNumber !== number) flags.push(`printed-number-${opening.printedNumber}`);
    return {
      number,
      titleZh: opening.zh,
      titlePinyin: opening.pinyin,
      titleEn: opening.en,
      firstPage: opening.page,
      lastPage: (openings[index + 1]?.page ?? endPage + 1) - 1,
      flags,
    };
  });
}
