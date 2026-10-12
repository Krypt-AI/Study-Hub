import type { ChoiceQuestion, Question } from './types';

/** A choice whose options are bare numbers: the option texts are printed in the booklet or page image. */
export function isNumberedChoice(question: Question): question is ChoiceQuestion {
  return question.type === 'choice' && question.options.every((option) => /^\d+$/u.test(option.text.trim()));
}
