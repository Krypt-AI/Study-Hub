/**
 * Hanyu Pinyin parsing and comparison.
 *
 * Accepts tone marks ("nǐ hǎo"), tone numbers ("ni3 hao3"), unspaced input ("nǐhǎo"),
 * "v" / "u:" / "ü" for ü, apostrophes and erhua ("nǎr"). Internally ü is written "v".
 */

export type Tone = 1 | 2 | 3 | 4 | 5; // 5 = neutral tone

export interface Syllable {
  base: string; // toneless syllable, ü written as "v"; "r" for an erhua suffix
  tone: Tone | null; // null when the learner gave no tones at all
}

// ---------------------------------------------------------------------------
// Syllable inventory
// ---------------------------------------------------------------------------

/**
 * Generated from Hanyu Pinyin phonotactics instead of being listed by hand: each final
 * names the initials it combines with ("0" = no initial). Finals are written in their
 * standard abbreviated forms (iu = iou, ui = uei, un = uen), "-i" is the apical vowel
 * of zhi/chi/shi/ri/zi/ci/si, and v-finals are the ü series.
 * Verified against CC-CEDICT (2026-10): every generated syllable occurs in the dictionary.
 * CC-CEDICT's only other syllables are the erhua suffix "r" (parsed separately), the
 * interjections below, and rare dialect forms (biang, sei, fiao, ...), excluded on purpose.
 */
const FINAL_INITIALS: ReadonlyArray<readonly [final: string, initials: string]> = [
  ['a', '0 b p m f d t n l g k h zh ch sh z c s'],
  ['o', '0 b p m f l'],
  ['e', '0 m d t n l g k h zh ch sh r z c s'],
  ['ai', '0 b p m d t n l g k h zh ch sh z c s'],
  ['ei', '0 b p m f d t n l g k h zh sh z'],
  ['ao', '0 b p m d t n l g k h zh ch sh r z c s'],
  ['ou', '0 p m f d t n l g k h zh ch sh r z c s'],
  ['an', '0 b p m f d t n l g k h zh ch sh r z c s'],
  ['en', '0 b p m f d n g k h zh ch sh r z c s'],
  ['ang', '0 b p m f d t n l g k h zh ch sh r z c s'],
  ['eng', '0 b p m f d t n l g k h zh ch sh r z c s'],
  ['ong', 'd t n l g k h zh ch r z c s'],
  ['er', '0'],
  ['-i', 'zh ch sh r z c s'],
  ['i', '0 b p m d t n l j q x'],
  ['ia', '0 d l j q x'],
  ['ie', '0 b p m d t n l j q x'],
  ['iao', '0 b p m d t n l j q x'],
  ['iu', '0 m d n l j q x'],
  ['ian', '0 b p m d t n l j q x'],
  ['in', '0 b p m n l j q x'],
  ['iang', '0 n l j q x'],
  ['ing', '0 b p m d t n l j q x'],
  ['iong', '0 j q x'],
  ['u', '0 b p m f d t n l g k h zh ch sh r z c s'],
  ['ua', '0 g k h zh ch sh r'],
  ['uo', '0 d t n l g k h zh ch sh r z c s'],
  ['uai', '0 g k h zh ch sh'],
  ['ui', '0 d t g k h zh ch sh r z c s'],
  ['uan', '0 d t n l g k h zh ch sh r z c s'],
  ['un', '0 d t n l g k h zh ch sh r z c s'],
  ['uang', '0 g k h zh ch sh'],
  ['ueng', '0'],
  ['v', '0 n l j q x'],
  ['ve', '0 n l j q x'],
  ['van', '0 j q x'],
  ['vn', '0 j q x'],
];

/** Spelling of finals that stand alone (y/w rules). */
const ZERO_INITIAL_SPELLING: Readonly<Record<string, string>> = {
  i: 'yi', ia: 'ya', ie: 'ye', iao: 'yao', iu: 'you', ian: 'yan', in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong',
  u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', ui: 'wei', uan: 'wan', un: 'wen', uang: 'wang', ueng: 'weng',
  v: 'yu', ve: 'yue', van: 'yuan', vn: 'yun',
};

/** Interjection outside the regular initial + final grid. */
const SPECIAL_SYLLABLES = ['yo'];

/** Interjections accepted only as whole words, so a typo like "nim" never parses as "ni" + "m". */
const STANDALONE_INTERJECTIONS: ReadonlySet<string> = new Set(['m', 'hm', 'hng']);

function spell(initial: string, final: string): string {
  if (final === '-i') return `${initial}i`;
  if (initial === '0') return ZERO_INITIAL_SPELLING[final] ?? final;
  // After j, q and x the dots of ü are dropped: ju, que, xuan, jun.
  if ('jqx'.includes(initial) && final.startsWith('v')) return `${initial}u${final.slice(1)}`;
  return initial + final;
}

export const SYLLABLES: ReadonlySet<string> = new Set([
  ...FINAL_INITIALS.flatMap(([final, initials]) => initials.split(' ').map((initial) => spell(initial, final))),
  ...SPECIAL_SYLLABLES,
]);

const MAX_SYLLABLE_LENGTH = 6; // zhuang, chuang, shuang

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

// The breve (ă) is not standard pinyin, but Chinese typesetting widely prints the third
// tone with it (ă ĕ ĭ ŏ ŭ instead of ǎ ě ǐ ǒ ǔ), as in the HSK textbooks themselves.
const TONE_FROM_MARK: Readonly<Record<string, Tone>> = { '̄': 1, '́': 2, '̌': 3, '̆': 3, '̀': 4 };
const MARK_FROM_TONE: Readonly<Record<number, string>> = { 1: '̄', 2: '́', 3: '̌', 4: '̀' };
const DIAERESIS = '̈';
const CIRCUMFLEX = '̂'; // ê
const SEPARATOR = /[\s'’`\-·.,!?;:，。！？、；：…“”"()（）]/u;

interface Letter {
  char: string;
  tone: Tone | null;
}

interface Chunk {
  letters: Letter[];
  digitTone: Tone | null;
}

function toneFromDigit(digit: string): Tone {
  const value = Number(digit);
  return value >= 1 && value <= 4 ? (value as Tone) : 5;
}

function tokenize(input: string): Chunk[] | null {
  const chunks: Chunk[] = [];
  let letters: Letter[] = [];
  const flush = (digitTone: Tone | null) => {
    if (letters.length) chunks.push({ letters, digitTone });
    letters = [];
  };

  // "ɑ" (Latin alpha) and "ɡ" (script g) appear in pinyin fonts in place of a and g.
  const text = input.normalize('NFD').toLowerCase().replace(/ɑ/gu, 'a').replace(/ɡ/gu, 'g');
  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index);
    const previous = letters.at(-1);
    if (char >= 'a' && char <= 'z') {
      letters.push({ char, tone: null });
    } else if (char in TONE_FROM_MARK) {
      if (!previous) return null;
      previous.tone = TONE_FROM_MARK[char] ?? null;
    } else if (char === DIAERESIS) {
      if (previous?.char !== 'u') return null;
      previous.char = 'v';
    } else if (char === ':' && previous?.char === 'u') {
      previous.char = 'v'; // CC-CEDICT style "lu:4"
    } else if (char === CIRCUMFLEX) {
      continue;
    } else if (/[0-5]/u.test(char)) {
      flush(toneFromDigit(char));
    } else if (SEPARATOR.test(char)) {
      flush(null);
    } else {
      return null; // not pinyin (e.g. Chinese characters)
    }
  }
  flush(null);
  return chunks;
}

function canonicalBase(raw: string): string {
  if (raw === 'lue' || raw === 'nue') return `${raw.charAt(0)}ve`; // older spelling of lüe / nüe
  return raw.replace(/^([jqxy])v/u, '$1u'); // "jü" / "yü" typed with dots
}

function pieceCost(piece: Letter[], insideWord: boolean, wholeChunk: boolean): number | null {
  const base = canonicalBase(piece.map((letter) => letter.char).join(''));
  if (piece.filter((letter) => letter.tone !== null).length > 1) return null; // one tone mark per syllable
  if (base === 'r') return insideWord ? 1.2 : null; // erhua suffix
  if (STANDALONE_INTERJECTIONS.has(base)) return wholeChunk ? 1 : null;
  if (!SYLLABLES.has(base)) return null;
  // A syllable starting with a, e or o inside a word would need an apostrophe in standard
  // spelling, so "fangan" reads as fan-gan rather than fang-an.
  return insideWord && /^[aeo]/u.test(base) ? 1.01 : 1;
}

function segment(letters: Letter[]): Letter[][] | null {
  const best: Array<{ cost: number; start: number } | undefined> = [{ cost: 0, start: -1 }];
  for (let end = 1; end <= letters.length; end++) {
    for (let start = Math.max(0, end - MAX_SYLLABLE_LENGTH); start < end; start++) {
      const from = best[start];
      if (!from) continue;
      const cost = pieceCost(letters.slice(start, end), start > 0, start === 0 && end === letters.length);
      if (cost === null) continue;
      const current = best[end];
      if (!current || from.cost + cost < current.cost) best[end] = { cost: from.cost + cost, start };
    }
  }
  if (!best[letters.length]) return null;
  const pieces: Letter[][] = [];
  for (let end = letters.length; end > 0; ) {
    const start = best[end]!.start;
    pieces.unshift(letters.slice(start, end));
    end = start;
  }
  return pieces;
}

/** Parse pinyin into syllables, or return null when the text is not valid pinyin. */
export function parsePinyin(input: string): Syllable[] | null {
  const chunks = tokenize(input);
  if (!chunks || chunks.length === 0) return null;

  const syllables: Syllable[] = [];
  let hasToneInformation = false;
  for (const chunk of chunks) {
    // Erhua typed after a tone number ("na3r") arrives as its own one-letter chunk.
    if (chunk.letters.length === 1 && chunk.letters[0]?.char === 'r' && syllables.length > 0) {
      syllables.push({ base: 'r', tone: null });
      continue;
    }
    const pieces = segment(chunk.letters);
    if (!pieces) return null;
    pieces.forEach((piece, index) => {
      const marked = piece.find((letter) => letter.tone !== null)?.tone ?? null;
      const isLast = index === pieces.length - 1;
      const tone = marked ?? (isLast ? chunk.digitTone : null);
      if (tone !== null) hasToneInformation = true;
      syllables.push({ base: canonicalBase(piece.map((letter) => letter.char).join('')), tone });
    });
  }
  // Once any tone is given, unmarked syllables are neutral-tone syllables.
  return hasToneInformation
    ? syllables.map((syllable) => ({ ...syllable, tone: syllable.base === 'r' ? null : (syllable.tone ?? 5) }))
    : syllables;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function toneVowelIndex(plain: string): number {
  for (const vowel of ['a', 'e']) {
    const index = plain.indexOf(vowel);
    if (index >= 0) return index;
  }
  const ou = plain.indexOf('ou');
  if (ou >= 0) return ou;
  for (let index = plain.length - 1; index >= 0; index--) {
    if ('iouü'.includes(plain.charAt(index))) return index; // iu -> u, ui -> i
  }
  return -1;
}

/** "hao" + 3 -> "hǎo"; neutral or unknown tones are left unmarked. */
export function formatSyllable({ base, tone }: Syllable): string {
  const plain = base.replace(/v/gu, 'ü');
  const mark = tone ? MARK_FROM_TONE[tone] : undefined;
  const index = toneVowelIndex(plain);
  if (!mark || index < 0) return plain;
  return (plain.slice(0, index + 1) + mark + plain.slice(index + 1)).normalize('NFC');
}

/** Render pinyin with tone marks, e.g. "ni3 hao3" -> "nǐ hǎo" (null if not pinyin). */
export function toMarkedPinyin(input: string): string | null {
  const syllables = parsePinyin(input);
  return syllables ? syllables.map(formatSyllable).join(' ').replace(/ r\b/gu, 'r') : null;
}

const TONE_NAMES: Readonly<Record<Tone, string>> = {
  1: '1st tone',
  2: '2nd tone',
  3: '3rd tone',
  4: '4th tone',
  5: 'neutral tone',
};

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export type PinyinVerdict = 'correct' | 'tone-slip' | 'missing-tones' | 'u-umlaut-slip' | 'different' | 'not-pinyin';

export interface PinyinComparison {
  verdict: PinyinVerdict;
  messages: string[];
}

const basesOf = (syllables: Syllable[]) => syllables.map((syllable) => syllable.base).join(' ');

export function comparePinyin(response: string, expected: string, toneSensitive = true): PinyinComparison {
  const reference = parsePinyin(expected);
  const answer = parsePinyin(response);
  if (!answer) {
    return {
      verdict: 'not-pinyin',
      messages: [
        /\p{Script=Han}/u.test(response)
          ? 'Type the pinyin (Latin letters), not the characters.'
          : 'That is not valid pinyin. Check the spelling of each syllable.',
      ],
    };
  }
  if (!reference) {
    // The reference itself is unparseable (e.g. an OCR slip): fall back to plain comparison.
    const same = response.normalize('NFC').trim().toLowerCase() === expected.normalize('NFC').trim().toLowerCase();
    return { verdict: same ? 'correct' : 'different', messages: [] };
  }

  if (basesOf(answer) !== basesOf(reference)) {
    const withUmlaut = answer.map((syllable) => ({ ...syllable, base: syllable.base.replace(/^([nl])u(e?)$/u, '$1v$2') }));
    if (basesOf(withUmlaut) === basesOf(reference)) {
      return { verdict: 'u-umlaut-slip', messages: ['Write ü (or type v) after n and l, e.g. nǚ / nv3, lǜ / lv4.'] };
    }
    return { verdict: 'different', messages: describeSyllableDifferences(answer, reference) };
  }

  if (!toneSensitive) return { verdict: 'correct', messages: [] };

  const toned = (syllables: Syllable[]) => syllables.filter((syllable) => syllable.base !== 'r');
  const answerToned = toned(answer);
  const referenceToned = toned(reference);
  if (answerToned.every((syllable) => syllable.tone === null)) {
    return {
      verdict: 'missing-tones',
      messages: ['The syllables are right. Add the tones with marks (hǎo) or numbers (hao3).'],
    };
  }

  const messages: string[] = [];
  referenceToned.forEach((expectedSyllable, index) => {
    const given = answerToned[index];
    if (given && given.tone !== expectedSyllable.tone) {
      messages.push(
        `${formatSyllable(given)} should be ${formatSyllable(expectedSyllable)} ` +
          `(${TONE_NAMES[expectedSyllable.tone ?? 5]}, not ${TONE_NAMES[given.tone ?? 5]}).`,
      );
    }
  });
  return messages.length ? { verdict: 'tone-slip', messages } : { verdict: 'correct', messages: [] };
}

function describeSyllableDifferences(answer: Syllable[], reference: Syllable[]): string[] {
  if (answer.length !== reference.length) {
    return [`Expected ${reference.length} syllable(s), you wrote ${answer.length}.`];
  }
  return reference.flatMap((expectedSyllable, index) => {
    const given = answer[index];
    return given && given.base !== expectedSyllable.base
      ? [`Syllable ${index + 1}: "${formatSyllable(given)}" should be "${formatSyllable(expectedSyllable)}".`]
      : [];
  });
}

/** True when the text parses as pinyin (used to pick an input mode for free text). */
export function isPinyin(text: string): boolean {
  return parsePinyin(text) !== null;
}
