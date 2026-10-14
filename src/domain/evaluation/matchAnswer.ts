/**
 * Compares one typed answer with the accepted answers, using the comparison rules of
 * the question's match mode (text, meaning, pinyin, kana, hanzi, number, exact).
 */
import type { MatchOptions } from '@/domain/content/types';
import { allowedTypos, editDistance } from './distance';
import { compareKana } from './kana';
import { glossOf, sameMeaning } from './meaning';
import { compactCjk, expandAlternatives, fold, normalizeText, stripLeadingFiller } from './normalize';
import { comparePinyin, parsePinyin } from './pinyin';

export type MatchVerdict = 'correct' | 'almost' | 'incorrect';

export interface MatchResult {
  verdict: MatchVerdict;
  /** The accepted answer that matched, or the closest one. */
  closest: string;
  messages: string[];
}

const RANK: Record<MatchVerdict, number> = { correct: 2, almost: 1, incorrect: 0 };

export function matchAnswer(response: string, accepted: readonly string[], options: MatchOptions): MatchResult {
  const trimmed = response.trim();
  const fallback = accepted[0] ?? '';
  if (!trimmed) return { verdict: 'incorrect', closest: fallback, messages: ['No answer given.'] };

  let best: (MatchResult & { distance: number }) | undefined;
  for (const answer of accepted) {
    const result = matchOne(trimmed, answer, options);
    if (
      !best ||
      RANK[result.verdict] > RANK[best.verdict] ||
      (RANK[result.verdict] === RANK[best.verdict] && result.distance < best.distance)
    ) {
      best = result;
    }
    if (best.verdict === 'correct') break;
  }
  return best ? { verdict: best.verdict, closest: best.closest, messages: best.messages } : { verdict: 'incorrect', closest: fallback, messages: [] };
}

type ScoredMatch = MatchResult & { distance: number };

function matchOne(response: string, answer: string, options: MatchOptions): ScoredMatch {
  switch (options.mode) {
    case 'pinyin':
      return matchPinyin(response, answer, options);
    case 'kana':
      return matchKana(response, answer, options);
    case 'hanzi':
      return matchCharacters(response, answer);
    case 'number':
      return matchNumber(response, answer, options);
    case 'exact': {
      const same = options.caseSensitive ? response === answer.trim() : response.toLowerCase() === answer.trim().toLowerCase();
      return { verdict: same ? 'correct' : 'incorrect', closest: answer, messages: [], distance: same ? 0 : 1 };
    }
    case 'text':
      return matchText(response, answer, options);
    case 'meaning':
      return matchMeaning(response, answer, options);
  }
}

function matchPinyin(response: string, answer: string, options: MatchOptions): ScoredMatch {
  const comparison = comparePinyin(response, answer, options.toneSensitive);
  const distance = editDistance(response.toLowerCase(), answer.toLowerCase());
  switch (comparison.verdict) {
    case 'correct':
      return { verdict: 'correct', closest: answer, messages: comparison.messages, distance: 0 };
    case 'missing-tones':
    case 'u-umlaut-slip':
      return { verdict: 'almost', closest: answer, messages: comparison.messages, distance };
    case 'tone-slip': {
      // One wrong tone in a multi-syllable word is a slip; anything more is an error.
      const syllables = parsePinyin(answer)?.length ?? 1;
      const verdict = comparison.messages.length === 1 && syllables > 1 ? 'almost' : 'incorrect';
      return { verdict, closest: answer, messages: comparison.messages, distance };
    }
    default:
      return { verdict: 'incorrect', closest: answer, messages: comparison.messages, distance };
  }
}

function matchKana(response: string, answer: string, options: MatchOptions): ScoredMatch {
  const comparison = compareKana(response, answer, options.acceptRomaji);
  const verdict: MatchVerdict =
    comparison.verdict === 'correct' ? 'correct' : comparison.verdict === 'romaji' ? 'almost' : 'incorrect';
  return { verdict, closest: answer, messages: comparison.messages, distance: editDistance(response, answer) };
}

function matchCharacters(response: string, answer: string): ScoredMatch {
  const given = Array.from(compactCjk(response));
  const expected = Array.from(compactCjk(answer));
  if (given.join('') === expected.join('')) return { verdict: 'correct', closest: answer, messages: [], distance: 0 };

  const messages: string[] = [];
  if (!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(response)) {
    messages.push('Write the answer in characters (use a Chinese or Japanese input method).');
  } else if (given.length === expected.length) {
    given.forEach((character, index) => {
      if (character !== expected[index]) messages.push(`Character ${index + 1}: you wrote ${character}, expected ${expected[index]}.`);
    });
  } else {
    messages.push(`Expected ${expected.length} character(s), you wrote ${given.length}.`);
  }
  return { verdict: 'incorrect', closest: answer, messages, distance: editDistance(given.join(''), expected.join('')) };
}

/** A decimal ("0.4", "1,000") or a simple fraction ("2/5"), as answers to probability questions often are. */
function parseNumber(text: string): number | null {
  const compact = fold(text).replace(/[,\s_]/gu, '');
  const fraction = /^(-?[\d.]+)\/([\d.]+)$/u.exec(compact);
  const value = fraction ? Number(fraction[1]) / Number(fraction[2]) : Number(compact);
  return Number.isFinite(value) ? value : null;
}

function matchNumber(response: string, answer: string, options: MatchOptions): ScoredMatch {
  const given = parseNumber(response);
  const expected = parseNumber(answer);
  if (given === null) return { verdict: 'incorrect', closest: answer, messages: ['Enter a number.'], distance: Infinity };
  if (expected === null) return { verdict: 'incorrect', closest: answer, messages: [], distance: Infinity };
  const difference = Math.abs(given - expected);
  return {
    verdict: difference <= options.tolerance + Number.EPSILON ? 'correct' : 'incorrect',
    closest: answer,
    messages: [],
    distance: difference,
  };
}

function matchText(response: string, answer: string, options: MatchOptions): ScoredMatch {
  const normalize = (text: string) => stripLeadingFiller(normalizeText(text, { caseSensitive: options.caseSensitive }));
  const given = normalize(response);
  let best: ScoredMatch | undefined;
  for (const variant of expandAlternatives(answer)) {
    const expected = normalize(variant);
    if (!expected) continue;
    if (given === expected) return { verdict: 'correct', closest: variant, messages: [], distance: 0 };
    const distance = editDistance(given, expected);
    if (!best || distance < best.distance) {
      const isTypo = distance <= allowedTypos(expected, options.typoTolerance);
      best = {
        verdict: isTypo ? 'almost' : 'incorrect',
        closest: variant,
        messages: isTypo ? [`Accepted with a spelling slip: "${variant}".`] : [],
        distance,
      };
    }
  }
  return best ?? { verdict: 'incorrect', closest: answer, messages: [], distance: Infinity };
}

/** Like text mode, but a conversational form of the meaning counts too ("I'm sorry" for "to be sorry"). */
function matchMeaning(response: string, answer: string, options: MatchOptions): ScoredMatch {
  const given = glossOf(response);
  let best: ScoredMatch | undefined;
  for (const variant of expandAlternatives(answer)) {
    const expected = glossOf(variant);
    if (!expected.core) continue;
    if (sameMeaning(given, expected)) {
      const messages = given.core === expected.core ? [] : [`The book gives this as "${answer}".`];
      return { verdict: 'correct', closest: variant, messages, distance: 0 };
    }
    const distance = editDistance(given.core, expected.core);
    if (!best || distance < best.distance) {
      const isTypo = distance <= allowedTypos(expected.core, options.typoTolerance);
      best = {
        verdict: isTypo ? 'almost' : 'incorrect',
        closest: variant,
        messages: isTypo ? [`Accepted with a spelling slip: "${variant}".`] : [],
        distance,
      };
    }
  }
  return best ?? { verdict: 'incorrect', closest: answer, messages: [], distance: Infinity };
}
