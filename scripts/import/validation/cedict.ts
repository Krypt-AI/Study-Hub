/**
 * Optional pinyin cross-check against CC-CEDICT (https://cc-cedict.org, CC BY-SA 4.0).
 * Used only to *flag* readings that disagree with the dictionary for human review; it
 * never changes the content taken from the books. Skipped when the file is absent.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { parsePinyin, type Syllable } from '../../../src/domain/evaluation/pinyin.ts';
import { PIPELINE_CACHE_DIR } from '../ocr.ts';

export const CEDICT_PATH = process.env.CEDICT_PATH ?? join(PIPELINE_CACHE_DIR, 'cedict.txt.gz');

export type CedictIndex = Map<string, string[]>;

export function loadCedict(path = CEDICT_PATH): CedictIndex | undefined {
  if (!existsSync(path)) return undefined;
  const raw = path.endsWith('.gz') ? gunzipSync(readFileSync(path)).toString('utf8') : readFileSync(path, 'utf8');
  const index: CedictIndex = new Map();
  for (const line of raw.split('\n')) {
    if (line.startsWith('#')) continue;
    // Traditional Simplified [pin1 yin1] /meaning/
    const match = /^\S+ (\S+) \[([^\]]+)\]/u.exec(line);
    if (!match?.[1] || !match[2]) continue;
    const readings = index.get(match[1]) ?? [];
    readings.push(match[2].toLowerCase().replace(/u:/gu, 'v'));
    index.set(match[1], readings);
  }
  return index;
}

/** Characters whose printed tone changes with the following syllable (tone sandhi). */
const SANDHI_TONES: Readonly<Record<string, number[]>> = { 一: [1, 2, 4], 不: [2, 4] };

function syllablesAgree(printed: Syllable, dictionary: { base: string; tone: number }, character: string): boolean {
  if (printed.base !== dictionary.base) return false;
  const tone = printed.tone ?? 5;
  if (tone === dictionary.tone || tone === 5 || dictionary.tone === 5) return true; // neutral-tone spellings vary
  return SANDHI_TONES[character]?.includes(tone) ?? false;
}

function parseCedictReading(reading: string): Array<{ base: string; tone: number }> {
  return reading.split(' ').map((token) => {
    const match = /^([a-zv]+)([1-5])$/u.exec(token);
    return match?.[1] && match[2] ? { base: match[1], tone: Number(match[2]) } : { base: token, tone: 5 };
  });
}

export type CedictCheck = { status: 'agrees' } | { status: 'not-in-dictionary' } | { status: 'differs'; dictionary: string[] };

export function checkReading(index: CedictIndex, word: string, pinyin: string): CedictCheck {
  const readings = index.get(word.replace(/[…·（）()]/gu, ''));
  const printed = parsePinyin(pinyin)?.filter((syllable) => syllable.base !== 'r');
  if (!readings || !printed) return { status: 'not-in-dictionary' };
  const characters = Array.from(word).filter((character) => /\p{Script=Han}/u.test(character) && character !== '儿');
  const agrees = readings.some((reading) => {
    const dictionary = parseCedictReading(reading).filter((syllable) => syllable.base !== 'r');
    return (
      dictionary.length === printed.length &&
      dictionary.every((syllable, index) => {
        const printedSyllable = printed[index];
        return printedSyllable !== undefined && syllablesAgree(printedSyllable, syllable, characters[index] ?? '');
      })
    );
  });
  return agrees ? { status: 'agrees' } : { status: 'differs', dictionary: readings };
}
