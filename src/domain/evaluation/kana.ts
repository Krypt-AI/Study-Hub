/**
 * Japanese reading comparison. Hiragana, katakana and romaji answers are compared in
 * one canonical hiragana form, and common near-misses (long vowels, small っ/ゃ,
 * dakuten) get a specific explanation instead of a bare "incorrect".
 */
import { isRomaji, toHiragana, toKatakana } from 'wanakana';
import { compactCjk } from './normalize';

const MACRONS: Readonly<Record<string, string>> = { ā: 'aa', ī: 'ii', ū: 'uu', ē: 'ee', ō: 'ou', â: 'aa', î: 'ii', û: 'uu', ê: 'ee', ô: 'ou' };

function expandMacrons(text: string): string {
  return text.replace(/[āīūēōâîûêô]/gu, (vowel) => MACRONS[vowel] ?? vowel);
}

/** IME habit: "nn" before a consonant or at the end means ん ("ninnjinn" -> にんじん). */
function normalizeImeN(romaji: string): string {
  return romaji.replace(/nn(?=[^aiueoy]|$)/gu, "n'");
}

/** Canonical hiragana for comparison. Round-tripping through katakana makes ー, spelled long vowels and romaji consistent. */
export function canonicalKana(text: string): string {
  const compact = compactCjk(expandMacrons(text.toLowerCase()));
  const prepared = isRomaji(compact) ? normalizeImeN(compact) : compact;
  return toHiragana(toKatakana(prepared));
}

const HAS_KANJI = /\p{Script=Han}/u;
const HAS_LATIN = /[a-z]/iu;

export type KanaVerdict = 'correct' | 'romaji' | 'kanji-instead' | 'different';

export interface KanaComparison {
  verdict: KanaVerdict;
  messages: string[];
}

// Skeletons that erase one category of detail; equal skeletons reveal the kind of slip.
// A long vowel is a kana followed by the vowel of its own row (お/う after the o-row, い/え after the e-row).
const LONG_VOWELS: ReadonlyArray<RegExp> = [
  /([あかさたなはまやらわがざだばぱゃ])あ/gu,
  /([いきしちにひみりぎじぢびぴ])い/gu,
  /([うくすつぬふむゆるぐずづぶぷゅ])う/gu,
  /([えけせてねへめれげぜでべぺ])[えい]/gu,
  /([おこそとのほもよろごぞどぼぽょ])[おう]/gu,
];
const withoutLongVowels = (kana: string) => LONG_VOWELS.reduce((text, pattern) => text.replace(pattern, '$1'), kana);
const withoutSmallTsu = (kana: string) => kana.replace(/っ/gu, '');
const withLargeYouon = (kana: string) => kana.replace(/[ゃゅょ]/gu, (small) => ({ ゃ: 'や', ゅ: 'ゆ', ょ: 'よ' })[small] ?? small);
const withoutDakuten = (kana: string) => kana.normalize('NFD').replace(/[゙゚]/gu, '').normalize('NFC');

export function compareKana(response: string, expected: string, acceptRomaji = true): KanaComparison {
  if (HAS_KANJI.test(response) && !HAS_KANJI.test(expected)) {
    return { verdict: 'kanji-instead', messages: ['Write the reading in kana (or romaji), not in kanji.'] };
  }
  const answer = canonicalKana(response);
  const reference = canonicalKana(expected);

  if (answer === reference) {
    const typedRomaji = HAS_LATIN.test(response);
    if (typedRomaji && !acceptRomaji) {
      return { verdict: 'romaji', messages: ['Correct reading, but please answer in kana this time.'] };
    }
    return { verdict: 'correct', messages: typedRomaji ? ['Accepted from romaji.'] : [] };
  }

  const slips: Array<[(kana: string) => string, string]> = [
    [withoutLongVowels, 'Check the long vowels (e.g. おばさん vs おばあさん, ときょう vs とうきょう).'],
    [withoutSmallTsu, 'Check the small っ (double consonant, e.g. きて vs きって).'],
    [withLargeYouon, 'Check the small ゃ/ゅ/ょ (e.g. きよう vs きょう).'],
    [withoutDakuten, 'Check the voiced marks ゛/゜ (e.g. か vs が, は vs ぱ).'],
  ];
  const messages = slips.filter(([skeleton]) => skeleton(answer) === skeleton(reference)).map(([, message]) => message);
  return { verdict: 'different', messages };
}
