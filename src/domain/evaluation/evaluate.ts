/**
 * Turns a learner's response into feedback for the question types that can be judged
 * synchronously. Code and SQL answers are executed in a sandbox first and judged in
 * `./runFeedback.ts`.
 */
import type {
  ChoiceQuestion,
  ClozeQuestion,
  LongQuestion,
  Question,
  ShortQuestion,
  TranslationQuestion,
} from '@/domain/content/types';
import { meetsKeywordGroups } from './keywords';
import { matchAnswer, type MatchResult, type MatchVerdict } from './matchAnswer';
import { countWords } from './normalize';
import { ALMOST_SCORE, type Feedback, type FeedbackPart, type FeedbackPoint, type Response, verdictFromScore } from './types';

export const HEADLINES: Record<Feedback['verdict'], string> = {
  correct: 'Correct',
  almost: 'Almost: accepted with a small slip',
  partial: 'Partly correct',
  incorrect: 'Not quite',
  'self-review': 'Compare your answer with the model answer',
};

const MATCH_SCORE: Record<MatchVerdict, number> = { correct: 1, almost: ALMOST_SCORE, incorrect: 0 };

function feedback(partial: Omit<Feedback, 'headline' | 'missing' | 'points'> & Partial<Pick<Feedback, 'missing' | 'points'>>): Feedback {
  return { headline: HEADLINES[partial.verdict], points: [], missing: [], ...partial };
}

const toPoints = (messages: string[], tone: FeedbackPoint['tone']): FeedbackPoint[] => messages.map((message) => ({ tone, message }));

export type SyncQuestion = Exclude<Question, { type: 'code' | 'sql' }>;

export function isSyncQuestion(question: Question): question is SyncQuestion {
  return question.type !== 'code' && question.type !== 'sql';
}

export function evaluate(question: SyncQuestion, response: Response): Feedback {
  if (response.type !== question.type) throw new Error(`Response type ${response.type} does not match question type ${question.type}`);
  switch (question.type) {
    case 'choice':
      return evaluateChoice(question, (response as Extract<Response, { type: 'choice' }>).selected);
    case 'short':
      return evaluateShort(question, (response as Extract<Response, { type: 'short' }>).text);
    case 'cloze':
      return evaluateCloze(question, (response as Extract<Response, { type: 'cloze' }>).blanks);
    case 'translation':
      return evaluateTranslation(question, (response as Extract<Response, { type: 'translation' }>).text);
    case 'long':
      return evaluateLong(question, (response as Extract<Response, { type: 'long' }>).text);
  }
}

export function evaluateChoice(question: ChoiceQuestion, selected: string[]): Feedback {
  const correct = new Set(question.correct);
  const chosen = new Set(selected);
  const optionText = (id: string) => question.options.find((option) => option.id === id)?.text ?? id;
  const expected = question.correct.map(optionText);
  const points: FeedbackPoint[] = [];

  for (const id of chosen) {
    const option = question.options.find((candidate) => candidate.id === id);
    if (!correct.has(id)) points.push({ tone: 'error', message: option?.explanation ?? `"${optionText(id)}" is not correct.` });
  }
  for (const id of correct) {
    const option = question.options.find((candidate) => candidate.id === id);
    if (!chosen.has(id) && question.multiple) points.push({ tone: 'warning', message: `Missed: "${optionText(id)}".` });
    if (option?.explanation && chosen.has(id)) points.push({ tone: 'success', message: option.explanation });
  }

  if (!question.multiple) {
    const isRight = chosen.size === 1 && correct.has([...chosen][0] ?? '');
    return feedback({ verdict: isRight ? 'correct' : 'incorrect', score: isRight ? 1 : 0, points, expected });
  }
  const hits = [...chosen].filter((id) => correct.has(id)).length;
  const wrong = chosen.size - hits;
  const score = Math.max(0, (hits - wrong) / correct.size);
  return feedback({ verdict: verdictFromScore(score), score, points, expected });
}

function fromMatch(result: MatchResult, expected: string[]): Feedback {
  const tone: FeedbackPoint['tone'] = result.verdict === 'correct' ? 'info' : result.verdict === 'almost' ? 'warning' : 'error';
  return feedback({
    verdict: result.verdict,
    score: MATCH_SCORE[result.verdict],
    points: toPoints(result.messages, tone),
    expected,
  });
}

export function evaluateShort(question: ShortQuestion, text: string): Feedback {
  const result = matchAnswer(text, question.accepted, question.match);
  const expected = [result.closest, ...question.accepted.filter((answer) => answer !== result.closest)];
  return fromMatch(result, expected);
}

export function evaluateCloze(question: ClozeQuestion, blanks: Record<string, string>): Feedback {
  const counted = new Set<string>();
  const parts: FeedbackPart[] = question.blanks.map((blank, index) => {
    const response = blanks[blank.id] ?? '';
    const result = matchAnswer(response, blank.accepted, blank.match);
    // "Name two of the errors": the same answer in a second gap is not a second error found.
    const key = response.trim().toLocaleLowerCase();
    if (question.distinct && result.verdict !== 'incorrect') {
      if (counted.has(key)) return { label: `Gap ${index + 1}`, verdict: 'incorrect', response, expected: blank.accepted[0], message: 'This answer is already counted in an earlier gap.' };
      counted.add(key);
    }
    return {
      label: `Gap ${index + 1}`,
      verdict: result.verdict,
      response,
      expected: blank.accepted[0],
      message: result.messages.join(' ') || undefined,
    };
  });
  const score = parts.reduce((sum, part) => sum + MATCH_SCORE[part.verdict as MatchVerdict], 0) / parts.length;
  const anyRight = parts.some((part) => part.verdict !== 'incorrect');
  const verdict = score >= 0.999 ? 'correct' : parts.every((part) => part.verdict !== 'incorrect') ? 'almost' : anyRight ? 'partial' : 'incorrect';
  return feedback({ verdict, score, parts, expected: question.blanks.map((blank) => blank.accepted[0] ?? '') });
}

const TRANSLATION_LIMITATION =
  'A sentence can be translated many ways. This check compares your answer with the reference translations and key phrases only, ' +
  'so compare it with the model answer and confirm the result yourself.';

export function evaluateTranslation(question: TranslationQuestion, text: string): Feedback {
  const mode = question.to === 'en' ? question.match : { ...question.match, mode: 'hanzi' as const };
  const result = matchAnswer(text, question.accepted, mode);
  if (result.verdict !== 'incorrect') return fromMatch(result, question.accepted);

  const found = question.keywords.filter((group) => meetsKeywordGroups(text, [group]));
  const missing = question.keywords.filter((group) => !found.includes(group)).map((group) => group.join(' / '));
  const score = question.keywords.length ? found.length / question.keywords.length : 0;
  return feedback({
    verdict: text.trim() ? 'self-review' : 'incorrect',
    score,
    points: found.map((group) => ({ tone: 'success' as const, message: `Includes "${group[0]}".` })),
    missing,
    expected: question.accepted,
    limitations: TRANSLATION_LIMITATION,
  });
}

const RUBRIC_LIMITATION =
  'Open answers are checked against a rubric by looking for key ideas and terms. It can miss ideas you expressed in other words, ' +
  'so tick the criteria you covered before confirming.';

/** What a written answer's feedback says, in the question's language (a BM question is answered and marked in BM). */
const LONG_ANSWER_TEXT = {
  en: {
    headline: HEADLINES['self-review'],
    tooShort: (words: number, min: number) => `Your answer has about ${words} words; aim for at least ${min}.`,
    tooLong: (words: number, max: number) => `Your answer has about ${words} words; the limit is ${max}.`,
  },
  ms: {
    headline: 'Tanda jawapan anda dengan panduan penskoran',
    tooShort: (words: number, min: number) => `Jawapan anda kira-kira ${words} patah perkataan; tulis sekurang-kurangnya ${min}.`,
    tooLong: (words: number, max: number) => `Jawapan anda kira-kira ${words} patah perkataan; hadnya ${max}.`,
  },
};

export function evaluateLong(question: LongQuestion, text: string): Feedback {
  const wording = LONG_ANSWER_TEXT[question.language === 'ms' ? 'ms' : 'en'];
  const rubric = question.rubric.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    weight: criterion.weight,
    detected: meetsKeywordGroups(text, criterion.keywords),
  }));
  const total = rubric.reduce((sum, criterion) => sum + criterion.weight, 0);
  const score = total ? rubric.reduce((sum, criterion) => sum + (criterion.detected ? criterion.weight : 0), 0) / total : 0;
  const points: FeedbackPoint[] = [];
  const words = countWords(text);
  if (question.minWords && words < question.minWords) {
    points.push({ tone: 'warning', message: wording.tooShort(words, question.minWords) });
  }
  if (question.maxWords && words > question.maxWords) {
    points.push({ tone: 'warning', message: wording.tooLong(words, question.maxWords) });
  }
  return feedback({
    verdict: text.trim() ? 'self-review' : 'incorrect',
    score: text.trim() ? score : 0,
    ...(text.trim() ? { headline: wording.headline } : {}),
    points,
    missing: rubric.filter((criterion) => !criterion.detected).map((criterion) => criterion.label),
    expected: [question.modelAnswer],
    rubric,
    marking: question.marking.length ? question.marking : undefined,
    limitations: question.marking.length ? undefined : RUBRIC_LIMITATION,
  });
}

/**
 * Typed answers are judged by wording, which can miss an answer that means the same thing,
 * so the learner may overrule a mark below "correct" ("I was right").
 */
export function canAcceptAsCorrect(question: Question, feedback: Feedback): boolean {
  const typed = question.type === 'short' || question.type === 'cloze' || question.type === 'translation';
  return typed && (feedback.verdict === 'almost' || feedback.verdict === 'partial' || feedback.verdict === 'incorrect');
}

export function acceptAsCorrect(original: Feedback): Feedback {
  return {
    ...original,
    verdict: 'correct',
    score: 1,
    headline: `${HEADLINES.correct} (marked by you)`,
    points: [...original.points, { tone: 'info', message: 'You marked this answer as correct.' }],
  };
}

/** Final result once the learner has confirmed a self-review (ticked rubric criteria or chose a grade). */
export function confirmSelfReview(original: Feedback, score: number): Feedback {
  const clamped = Math.min(1, Math.max(0, score));
  const verdict = verdictFromScore(clamped);
  return { ...original, verdict, score: clamped, headline: `${HEADLINES[verdict]} (self-assessed)` };
}
