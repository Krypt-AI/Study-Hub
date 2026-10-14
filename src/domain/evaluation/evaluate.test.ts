import { describe, expect, it } from 'vitest';
import { questionSchema } from '@/domain/content/schema';
import type { Question } from '@/domain/content/types';
import { acceptAsCorrect, canAcceptAsCorrect, confirmSelfReview, evaluate, type SyncQuestion } from './evaluate';
import { compareKana } from './kana';
import { matchAnswer } from './matchAnswer';
import { matchOptionsSchema } from '@/domain/content/schema';

const authored = { origin: 'authored' as const };
const parse = (raw: Record<string, unknown>) => questionSchema.parse({ source: authored, skill: 'recall', prompt: 'Q', ...raw }) as Question;
const options = (raw: Record<string, unknown> = {}) => matchOptionsSchema.parse(raw);

describe('matchAnswer: text mode', () => {
  it('ignores case, punctuation and leading "to"/articles', () => {
    expect(matchAnswer('Drink!', ['to drink'], options()).verdict).toBe('correct');
    expect(matchAnswer('the hospital', ['hospital'], options()).verdict).toBe('correct');
  });

  it('accepts each comma-separated alternative and drops parentheticals', () => {
    expect(matchAnswer('movie', ['film, movie'], options()).verdict).toBe('correct');
    expect(matchAnswer('number', ['(for date of month) number'], options()).verdict).toBe('correct');
  });

  it('does not split on slashes', () => {
    expect(matchAnswer('come', ['to come/go back'], options()).verdict).toBe('incorrect');
  });

  it('treats a small typo as "almost" and names the intended answer', () => {
    const result = matchAnswer('televsion', ['television'], options());
    expect(result.verdict).toBe('almost');
    expect(result.messages[0]).toContain('television');
    expect(matchAnswer('televsion', ['television'], options({ typoTolerance: 'none' })).verdict).toBe('incorrect');
  });

  it('rejects empty answers', () => {
    expect(matchAnswer('   ', ['dog'], options()).verdict).toBe('incorrect');
  });
});

describe('matchAnswer: meaning mode', () => {
  const meaning = options({ mode: 'meaning' });
  const verdict = (response: string, answer: string) => matchAnswer(response, [answer], meaning).verdict;

  it('accepts the conversational form of a dictionary gloss', () => {
    expect(verdict("I'm sorry", 'to be sorry')).toBe('correct');
    expect(verdict('I’m sorry', 'to be sorry')).toBe('correct');
    expect(verdict('sorry', 'to be sorry')).toBe('correct');
    expect(verdict('I apologize', 'to be sorry')).toBe('correct');
    expect(verdict('thank you', 'to thank')).toBe('correct');
    expect(verdict('thanks', 'to thank')).toBe('correct');
    expect(verdict('bye', 'to see you around')).toBe('correct');
    expect(verdict('goodbye', 'to see you around')).toBe('correct');
    expect(verdict('no problem', "you're welcome, don't mention it")).toBe('correct');
    expect(verdict("it's ok", "that's OK, it doesn't matter")).toBe('correct');
    expect(verdict('never mind', "that's OK, it doesn't matter")).toBe('correct');
  });

  it('names the book form when the answer was accepted as an equivalent', () => {
    expect(matchAnswer('thanks', ['to thank'], meaning).messages[0]).toContain('to thank');
    expect(matchAnswer('drink', ['to drink'], meaning).messages).toEqual([]);
  });

  it('matches equivalents on the whole phrase only', () => {
    expect(verdict('see you', 'to look at, to see')).toBe('incorrect');
    expect(verdict("you're welcome", 'to welcome')).toBe('incorrect');
    expect(verdict('never mind', 'good, fine')).toBe('incorrect');
  });

  it('keeps the text-mode rules: alternatives, typos and short pronoun answers', () => {
    expect(verdict('movie', 'film, movie')).toBe('correct');
    expect(verdict('televsion', 'television')).toBe('almost');
    expect(verdict('I', 'I, me')).toBe('correct');
    expect(verdict('you', '(singular) you')).toBe('correct');
  });
});

describe('matchAnswer: language modes', () => {
  it('pinyin: tone numbers equal tone marks; one wrong tone in a word is a slip', () => {
    expect(matchAnswer('dian4nao3', ['diànnǎo'], options({ mode: 'pinyin' })).verdict).toBe('correct');
    expect(matchAnswer('dian4nao4', ['diànnǎo'], options({ mode: 'pinyin' })).verdict).toBe('almost');
    expect(matchAnswer('hao4', ['hǎo'], options({ mode: 'pinyin' })).verdict).toBe('incorrect');
    expect(matchAnswer('dian nao', ['diànnǎo'], options({ mode: 'pinyin' })).verdict).toBe('almost');
  });

  it('kana: hiragana, katakana and romaji are interchangeable', () => {
    expect(matchAnswer('じんこう', ['じんこう'], options({ mode: 'kana' })).verdict).toBe('correct');
    expect(matchAnswer('jinkou', ['じんこう'], options({ mode: 'kana' })).verdict).toBe('correct');
    expect(matchAnswer('jinkou', ['じんこう'], options({ mode: 'kana', acceptRomaji: false })).verdict).toBe('almost');
    expect(matchAnswer('こーひー', ['コーヒー'], options({ mode: 'kana' })).verdict).toBe('correct');
    expect(matchAnswer('tōkyō', ['とうきょう'], options({ mode: 'kana' })).verdict).toBe('correct');
    expect(matchAnswer('ninnjinn', ['にんじん'], options({ mode: 'kana' })).verdict).toBe('correct');
  });

  it('kana: explains typical near-misses', () => {
    expect(compareKana('ときょう', 'とうきょう').messages[0]).toContain('long vowels');
    expect(compareKana('きて', 'きって').messages[0]).toContain('small っ');
    expect(compareKana('かいしや', 'かいしゃ').messages[0]).toContain('ゃ');
    expect(compareKana('かっこう', 'がっこう').messages[0]).toContain('voiced');
    expect(compareKana('人口', 'じんこう').verdict).toBe('kanji-instead');
  });

  it('hanzi: requires exact characters and points at the wrong one', () => {
    expect(matchAnswer('电脑', ['电脑'], options({ mode: 'hanzi' })).verdict).toBe('correct');
    const wrong = matchAnswer('电恼', ['电脑'], options({ mode: 'hanzi' }));
    expect(wrong.verdict).toBe('incorrect');
    expect(wrong.messages[0]).toContain('Character 2');
    expect(matchAnswer('diannao', ['电脑'], options({ mode: 'hanzi' })).messages[0]).toContain('characters');
  });

  it('number: compares numerically with tolerance', () => {
    expect(matchAnswer('1,024', ['1024'], options({ mode: 'number' })).verdict).toBe('correct');
    expect(matchAnswer('0.333', ['0.3333'], options({ mode: 'number', tolerance: 0.001 })).verdict).toBe('correct');
    expect(matchAnswer('254', ['256'], options({ mode: 'number' })).verdict).toBe('incorrect');
  });

  it('number: accepts a simple fraction for a decimal answer', () => {
    expect(matchAnswer('2/5', ['0.4'], options({ mode: 'number', tolerance: 0.001 })).verdict).toBe('correct');
    expect(matchAnswer(' 3 / 8 ', ['0.375'], options({ mode: 'number', tolerance: 0.001 })).verdict).toBe('correct');
    expect(matchAnswer('1/3', ['0.333'], options({ mode: 'number', tolerance: 0.001 })).verdict).toBe('correct');
    expect(matchAnswer('1/0', ['0'], options({ mode: 'number' })).messages).toEqual(['Enter a number.']);
  });
});

describe('evaluate', () => {
  it('single choice', () => {
    const question = parse({
      id: 'q1',
      type: 'choice',
      options: [
        { id: 'a', text: 'にんこう' },
        { id: 'b', text: 'じんこう', explanation: '人口 is read じんこう.' },
      ],
      correct: ['b'],
    }) as SyncQuestion;
    expect(evaluate(question, { type: 'choice', selected: ['b'] })).toMatchObject({ verdict: 'correct', score: 1 });
    const wrong = evaluate(question, { type: 'choice', selected: ['a'] });
    expect(wrong).toMatchObject({ verdict: 'incorrect', expected: ['じんこう'] });
  });

  it('multiple choice gives partial credit and penalises wrong picks', () => {
    const question = parse({
      id: 'q2',
      type: 'choice',
      multiple: true,
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
      correct: ['a', 'b'],
    }) as SyncQuestion;
    expect(evaluate(question, { type: 'choice', selected: ['a'] })).toMatchObject({ verdict: 'partial', score: 0.5 });
    expect(evaluate(question, { type: 'choice', selected: ['a', 'c'] })).toMatchObject({ verdict: 'incorrect', score: 0 });
  });

  it('cloze scores each gap', () => {
    const question = parse({
      id: 'q3',
      type: 'cloze',
      text: 'Python lists are [[1]] and tuples are [[2]].',
      blanks: [
        { id: '1', accepted: ['mutable'] },
        { id: '2', accepted: ['immutable'] },
      ],
    }) as SyncQuestion;
    const result = evaluate(question, { type: 'cloze', blanks: { '1': 'mutable', '2': 'mutable' } });
    expect(result.verdict).toBe('partial');
    expect(result.score).toBe(0.5);
    expect(result.parts?.[1]).toMatchObject({ verdict: 'incorrect', expected: 'immutable' });
  });

  it('long answers are self-reviewed against the rubric', () => {
    const question = parse({
      id: 'q4',
      type: 'long',
      skill: 'explain',
      modelAnswer: 'Overfitting is ...',
      rubric: [
        { id: 'train', label: 'Fits the training data too closely', keywords: [['training data', 'train set']] },
        { id: 'general', label: 'Generalises poorly to new data', keywords: [['generalize', 'generalise', 'unseen', 'new data']] },
        { id: 'fix', label: 'Names a remedy', keywords: [['regularization', 'regularisation', 'more data', 'early stopping', 'dropout']] },
      ],
    }) as SyncQuestion;
    const result = evaluate(question, {
      type: 'long',
      text: 'The model memorises the training data and so it does not generalise to unseen examples.',
    });
    expect(result.verdict).toBe('self-review');
    expect(result.rubric?.map((criterion) => criterion.detected)).toEqual([true, true, false]);
    expect(result.missing).toEqual(['Names a remedy']);
    expect(confirmSelfReview(result, 1).verdict).toBe('correct');
  });

  it('lets the learner overrule a typed answer marked by wording, but not a choice', () => {
    const short = parse({ id: 'q6', type: 'short', accepted: ['to be sorry'], match: { mode: 'meaning' } }) as SyncQuestion;
    const wrong = evaluate(short, { type: 'short', text: 'my fault' });
    expect(canAcceptAsCorrect(short, wrong)).toBe(true);
    expect(acceptAsCorrect(wrong)).toMatchObject({ verdict: 'correct', score: 1, headline: 'Correct (marked by you)' });
    expect(canAcceptAsCorrect(short, evaluate(short, { type: 'short', text: "I'm sorry" }))).toBe(false);

    const choice = parse({ id: 'q7', type: 'choice', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: ['a'] }) as SyncQuestion;
    expect(canAcceptAsCorrect(choice, evaluate(choice, { type: 'choice', selected: ['b'] }))).toBe(false);
  });

  it('translations fall back to self-review with key-phrase coverage', () => {
    const question = parse({
      id: 'q5',
      type: 'translation',
      skill: 'apply',
      from: 'zh',
      to: 'en',
      accepted: ['Can you speak Chinese?'],
      keywords: [['speak'], ['chinese']],
    }) as SyncQuestion;
    expect(evaluate(question, { type: 'translation', text: 'can you speak chinese' }).verdict).toBe('correct');
    const loose = evaluate(question, { type: 'translation', text: 'Do you know how to speak Chinese?' });
    expect(loose.verdict).toBe('self-review');
    expect(loose.score).toBe(1);
  });
});
