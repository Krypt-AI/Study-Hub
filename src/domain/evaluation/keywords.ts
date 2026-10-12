/**
 * Approximate phrase detection for rubric-based feedback on open answers.
 * This only estimates which ideas an answer mentions; the learner always confirms
 * the final result, so false negatives cost a click, never a wrong grade.
 */
import { compactCjk, normalizeText } from './normalize';

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** Light English stemmer: enough to match "trained" / "training" / "trains" with "train". */
export function stem(word: string): string {
  let result = word.toLowerCase().replace(/'s$/u, '');
  if (result.length <= 3) return result;
  if (result.endsWith('sses')) result = result.slice(0, -2);
  else if (result.endsWith('ies') && result.length > 4) result = `${result.slice(0, -3)}y`;
  else if (result.endsWith('s') && !/(?:ss|us|is)$/u.test(result)) result = result.slice(0, -1);
  if (result.endsWith('ing') && result.length > 5) result = result.slice(0, -3);
  else if (result.endsWith('ed') && result.length > 4) result = result.slice(0, -2);
  if (result.endsWith('e') && result.length > 4) result = result.slice(0, -1);
  return result;
}

function sameWord(a: string, b: string): boolean {
  if (a === b || stem(a) === stem(b)) return true;
  // Long words sharing most of their beginning (e.g. "normalisation" / "normalization").
  const shorter = Math.min(a.length, b.length);
  if (shorter < 6) return false;
  let common = 0;
  while (common < shorter && a[common] === b[common]) common++;
  return common >= Math.max(5, Math.floor(shorter * 0.8));
}

/** Does `text` mention `phrase`? Words must appear consecutively; CJK phrases as substrings. */
export function mentions(text: string, phrase: string): boolean {
  if (CJK.test(phrase)) return compactCjk(text).includes(compactCjk(phrase));
  const words = normalizeText(text).split(' ').filter(Boolean);
  const target = normalizeText(phrase).split(' ').filter(Boolean);
  if (target.length === 0) return false;
  for (let start = 0; start + target.length <= words.length; start++) {
    if (target.every((word, offset) => sameWord(words[start + offset] ?? '', word))) return true;
  }
  return false;
}

/** A keyword requirement is met when, for every synonym group, at least one phrase is mentioned. */
export function meetsKeywordGroups(text: string, groups: readonly (readonly string[])[]): boolean {
  return groups.length > 0 && groups.every((group) => group.some((phrase) => mentions(text, phrase)));
}
