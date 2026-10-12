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
  const parts: FeedbackPart[] = question.blanks.map((blank, index) => {
    const response = blanks[blank.id] ?? '';
    const result = matchAnswer(response, blank.accepted, blank.match);
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

export function evaluateLong(question: LongQuestion, text: string): Feedback {
  const rubric = question.rubric.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    weight: criterion.weight,
    detected: meetsKeywordGroups(text, criterion.keywords),
  }));
  const total = rubric.reduce((sum, criterion) => sum + criterion.weight, 0);
  const score = rubric.reduce((sum, criterion) => sum + (criterion.detected ? criterion.weight : 0), 0) / total;
  const points: FeedbackPoint[] = [];
  const words = countWords(text);
  if (question.minWords && words < question.minWords) {
    points.push({ tone: 'warning', message: `Your answer has about ${words} words; aim for at least ${question.minWords}.` });
  }
  return feedback({
    verdict: text.trim() ? 'self-review' : 'incorrect',
    score: text.trim() ? score : 0,
    points,
    missing: rubric.filter((criterion) => !criterion.detected).map((criterion) => criterion.label),
    expected: [question.modelAnswer],
    rubric,
    limitations: RUBRIC_LIMITATION,
  });
}

/** Final result once the learner has confirmed a self-review (ticked rubric criteria or chose a grade). */
export function confirmSelfReview(original: Feedback, score: number): Feedback {
  const clamped = Math.min(1, Math.max(0, score));
  const verdict = verdictFromScore(clamped);
  return { ...original, verdict, score: clamped, headline: `${HEADLINES[verdict]} (self-assessed)` };
}
