/** Text normalisation shared by all answer matchers. */

const PUNCTUATION_OR_SYMBOL = /[\p{P}\p{S}]+/gu;
const WHITESPACE = /\s+/gu;
const LEADING_FILLER = /^(?:to|a|an|the)\s+/u;
const PARENTHETICAL = /\s*[(（][^)）]*[)）]\s*/gu;

/**
 * Unicode-compatibility fold: full-width ASCII becomes half-width, half-width katakana
 * becomes full-width, and composed characters are canonicalised (NFKC).
 */
export function fold(text: string): string {
  return text.normalize('NFKC');
}

export interface TextNormalizeOptions {
  caseSensitive?: boolean;
  keepPunctuation?: boolean;
}

/** Fold, lowercase, turn punctuation into spaces and collapse whitespace. */
export function normalizeText(text: string, options: TextNormalizeOptions = {}): string {
  let result = fold(text).trim();
  if (!options.caseSensitive) result = result.toLocaleLowerCase();
  if (!options.keepPunctuation) result = result.replace(PUNCTUATION_OR_SYMBOL, ' ');
  return result.replace(WHITESPACE, ' ').trim();
}

/** Remove all whitespace and punctuation: for CJK answers, where spacing is not meaningful. */
export function compactCjk(text: string): string {
  return fold(text).replace(PUNCTUATION_OR_SYMBOL, '').replace(WHITESPACE, '');
}

/** Drop a leading "to", "a", "an" or "the" so "to drink" and "drink" compare equal. */
export function stripLeadingFiller(normalized: string): string {
  return normalized.replace(LEADING_FILLER, '');
}

/**
 * Variants of an English reference answer that should also be accepted:
 * "film, movie" -> ["film, movie", "film", "movie"];
 * "(for date of month) number" -> [..., "number"].
 * Slashes are deliberately not split ("come/go back" must not accept "come").
 */
export function expandAlternatives(answer: string): string[] {
  const variants = new Set<string>([answer]);
  const withoutParentheses = answer.replace(PARENTHETICAL, ' ').trim();
  if (withoutParentheses) variants.add(withoutParentheses);
  for (const base of [answer, withoutParentheses]) {
    for (const piece of base.split(/[,;，；]/u)) {
      const trimmed = piece.trim();
      if (trimmed) variants.add(trimmed);
      const pieceWithoutParentheses = trimmed.replace(PARENTHETICAL, ' ').trim();
      if (pieceWithoutParentheses) variants.add(pieceWithoutParentheses);
    }
  }
  return [...variants];
}

export function countWords(text: string): number {
  const cjkCharacters = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  const latinWords = text
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ')
    .split(/\s+/u)
    .filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  // Treat roughly two CJK characters as one "word" for length guidance.
  return latinWords + Math.ceil(cjkCharacters / 2);
}
