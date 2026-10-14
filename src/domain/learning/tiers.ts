/**
 * Easy, medium or hard multiple-choice questions: the learner picks the tier for each subject, and
 * practice sessions in it offer the choice questions of that tier. A question's tier is authored
 * (`tier` on a choice question); one without a tier, and every question that is not multiple
 * choice, is offered at every tier. The tier never changes the year or the language of what is shown.
 * (A question's `difficulty` is something else: imported books use it for their own grading.)
 */
import type { ChoiceQuestion, Question } from '@/domain/content/types';

export type QuestionTier = NonNullable<ChoiceQuestion['tier']>;

export const QUESTION_TIERS: QuestionTier[] = ['easy', 'medium', 'hard'];

export const QUESTION_TIER_LABELS: Record<QuestionTier, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export const DEFAULT_QUESTION_TIER: QuestionTier = 'medium';

export const tierOf = (question: Question): QuestionTier | undefined => (question.type === 'choice' ? question.tier : undefined);

export const offeredAt = (question: Question, tier: QuestionTier) => {
  const own = tierOf(question);
  return own === undefined || own === tier;
};

/** The tier the learner chose for a course, medium until they choose. */
export const tierFor = (tiers: Readonly<Record<string, QuestionTier>>, courseId: string): QuestionTier => tiers[courseId] ?? DEFAULT_QUESTION_TIER;
