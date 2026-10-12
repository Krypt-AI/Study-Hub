/**
 * Compares English meanings (glosses) of a Chinese or Japanese word. Books give the
 * dictionary form ("to be sorry", "to thank", "to see you around"); learners answer the
 * way the word is used in conversation ("I'm sorry", "thank you", "bye"). Both sides are
 * reduced to the core of the meaning, and everyday phrases are mapped to shared groups,
 * so either form is accepted.
 */
import { fold, normalizeText } from './normalize';

/** Contractions expanded before punctuation is dropped, so "I'm" and "I am" compare equal. */
const CONTRACTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bcan't\b/gu, 'cannot'],
  [/\bcan not\b/gu, 'cannot'],
  [/\bwon't\b/gu, 'will not'],
  [/n't\b/gu, ' not'],
  [/'m\b/gu, ' am'],
  [/'re\b/gu, ' are'],
  [/'ll\b/gu, ' will'],
  [/'ve\b/gu, ' have'],
  [/'d\b/gu, ' would'],
  [/\b(it|that|this|what|there|here|he|she|who)'s\b/gu, '$1 is'],
];

/**
 * Sentence frames around the core meaning: the infinitive of the dictionary form and the
 * "I am …" / "it is …" of a conversational answer. Only stripped when words remain after.
 */
const LEADING_FRAME = /^(?:to be|to|be|i am|i|it is|that is|this is|a|an|the)\s+(?=\S)/u;

/**
 * Everyday phrases that mean the same thing in conversation. Matching is on the whole
 * phrase, so "see you" counts as "goodbye" but never as "to see". A phrase may sit in
 * more than one group ("no problem" answers both a thank-you and an apology).
 */
const CONVERSATIONAL_EQUIVALENTS: readonly (readonly string[])[] = [
  ['thank', 'thank you', 'thanks', 'thanks a lot', 'thank you very much', 'thank you so much', 'many thanks'],
  ['sorry', 'so sorry', 'very sorry', 'apologize', 'apologise', 'my apologies'],
  ['excuse me', 'pardon me'],
  ['goodbye', 'good bye', 'bye', 'bye bye', 'see you', 'see you later', 'see you around', 'see you again', 'see you soon', 'farewell'],
  ['hello', 'hi', 'hey', 'hello there'],
  ['good morning', 'morning'],
  ['nice to meet you', 'pleased to meet you', 'glad to meet you'],
  ["you're welcome", "don't mention it", 'not at all', 'my pleasure', 'no problem', 'no worries'],
  [
    "that's OK",
    "that's okay",
    "it's OK",
    "it's okay",
    "that's all right",
    "it's all right",
    "that's fine",
    "it's fine",
    "it doesn't matter",
    'never mind',
    'no problem',
    'no worries',
  ],
  ['OK', 'okay', 'all right', 'alright'],
  ['yes', 'yeah', 'yep'],
  ['no', 'nope'],
  ['congratulations', 'congrats'],
];

function expandContractions(text: string): string {
  const lower = fold(text).toLocaleLowerCase().replace(/[’‘`]/gu, "'");
  return CONTRACTIONS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), lower);
}

const normalizePhrase = (text: string) => normalizeText(expandContractions(text));

function stripFrames(normalized: string): string {
  let previous: string;
  let current = normalized;
  do {
    previous = current;
    current = current.replace(LEADING_FRAME, '');
  } while (current !== previous);
  return current;
}

/** Normalised phrase -> keys of the groups it belongs to. */
const GROUPS_BY_PHRASE: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  CONVERSATIONAL_EQUIVALENTS.forEach((group, index) => {
    for (const phrase of group) {
      const normalized = normalizePhrase(phrase);
      map.set(normalized, [...(map.get(normalized) ?? []), `group:${index}`]);
    }
  });
  return map;
})();

export interface Gloss {
  /** The meaning without frames: "I'm sorry" and "to be sorry" both become "sorry". */
  core: string;
  /** Conversational groups the phrase belongs to, or its core when it is in none. */
  keys: ReadonlySet<string>;
}

export function glossOf(text: string): Gloss {
  const normalized = normalizePhrase(text);
  const core = stripFrames(normalized);
  const groups = [...(GROUPS_BY_PHRASE.get(normalized) ?? []), ...(GROUPS_BY_PHRASE.get(core) ?? [])];
  return { core, keys: new Set(groups.length ? groups : [core]) };
}

export function sameMeaning(given: Gloss, expected: Gloss): boolean {
  return given.core === expected.core || [...given.keys].some((key) => expected.keys.has(key));
}
