/** Helpers shared by the importers. */
import type { z } from 'zod';
import type { courseSchema, questionSchema } from '../../src/domain/content/schema.ts';

export type CourseInput = z.input<typeof courseSchema>;
export type QuestionInput = z.input<typeof questionSchema>;

/** Stable id fragment for CJK text: its code points in hex, e.g. 电脑 -> "7535-8111". */
export function codePointSlug(text: string): string {
  return Array.from(text)
    .filter((character) => /[\p{L}\p{N}]/u.test(character))
    .map((character) => character.codePointAt(0)!.toString(16))
    .join('-');
}

export const pad2 = (value: number) => String(value).padStart(2, '0');

/** Small deterministic PRNG so generated options are identical on every import. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDistinct<T>(pool: readonly T[], count: number, random: () => number): T[] {
  const copy = [...pool];
  const picked: T[] = [];
  while (picked.length < count && copy.length > 0) {
    const [item] = copy.splice(Math.floor(random() * copy.length), 1);
    if (item !== undefined) picked.push(item);
  }
  return picked;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}
