/**
 * Full-text search across content and the learner's code. Chinese and Japanese
 * have no spaces, so CJK runs are indexed as single characters plus character bigrams;
 * diacritics are folded so "diannao" finds "diànnǎo".
 */
import MiniSearch from 'minisearch';

export type SearchKind = 'course' | 'lesson' | 'question' | 'vocab' | 'certification' | 'project';

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  text: string;
  url: string;
}

const CJK_RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+|[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+/gu;
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

function foldDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').normalize('NFC');
}

export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const piece of text.normalize('NFKC').toLowerCase().split(/[\s\p{P}\p{S}]+/u)) {
    if (!piece) continue;
    for (const run of piece.match(CJK_RUN) ?? []) {
      if (CJK.test(run)) {
        const characters = Array.from(run);
        tokens.push(...characters);
        for (let index = 0; index < characters.length - 1; index++) tokens.push(`${characters[index]}${characters[index + 1]}`);
      } else {
        tokens.push(foldDiacritics(run));
      }
    }
  }
  return tokens;
}

export function createSearchIndex(entries: SearchEntry[]): MiniSearch<SearchEntry> {
  const index = new MiniSearch<SearchEntry>({
    fields: ['title', 'text'],
    storeFields: ['kind', 'title', 'url', 'text'],
    tokenize,
    searchOptions: {
      tokenize,
      boost: { title: 3 },
      prefix: (term) => !CJK.test(term) && term.length > 2,
      fuzzy: (term) => (!CJK.test(term) && term.length > 4 ? 0.15 : false),
      combineWith: 'AND',
    },
  });
  index.addAll(entries);
  return index;
}
