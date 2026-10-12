/**
 * Marking a finished exam: each answered question is judged once, unanswered questions
 * score zero, and raw scores are summed per section. Only answered questions are
 * recorded, so an unfinished sitting never floods the review schedule.
 */
import type { PracticeMode } from '@/data/records';
import type { Assessment, AssessmentSection, Question } from '@/domain/content/types';
import { type Feedback, isPassing, type Response } from '@/domain/evaluation/types';
import type { AnswerContext } from '@/domain/learning/recordAnswer';
import type { RunResponse } from '@/workers/protocol';
import { judgeResponse } from '../session/judge';
import { emptyResponse, hasAnswer } from '../session/responses';
import { expectedAnswers } from '../session/usePracticeSession';

export interface GradedItem {
  question: Question;
  response: Response;
  answered: boolean;
  feedback: Feedback;
  run?: RunResponse;
}

export interface GradedSection {
  section: AssessmentSection;
  items: GradedItem[];
  /** Time spent in the section. */
  timeUsedMs: number;
}

export interface Score {
  points: number;
  max: number;
  /** Answers still waiting for the learner's self-review. */
  pending: number;
}

const unansweredFeedback = (question: Question): Feedback => ({
  verdict: 'incorrect',
  score: 0,
  headline: 'Not answered',
  points: [],
  missing: [],
  expected: expectedAnswers(question),
});

export async function gradeSection(section: AssessmentSection, answers: Readonly<Record<string, Response>>, timeUsedMs: number): Promise<GradedSection> {
  const items: GradedItem[] = [];
  // One at a time: code answers share a runtime per language.
  for (const question of section.questions) {
    const response = answers[question.id] ?? emptyResponse(question);
    if (!hasAnswer(response)) {
      items.push({ question, response, answered: false, feedback: unansweredFeedback(question) });
      continue;
    }
    const { feedback, run } = await judgeResponse(question, response);
    items.push({ question, response, answered: true, feedback, run });
  }
  return { section, items, timeUsedMs };
}

export function scoreItems(items: GradedItem[]): Score {
  const score: Score = { points: 0, max: items.length, pending: 0 };
  for (const item of items) {
    if (item.feedback.verdict === 'self-review') score.pending++;
    else score.points += item.feedback.score;
  }
  return score;
}

export const scoreExam = (sections: GradedSection[]): Score => scoreItems(sections.flatMap((section) => section.items));

/** Passed when the pass mark is met; undefined when the exam has no pass mark or answers await review. */
export function passed(assessment: Assessment, score: Score): boolean | undefined {
  if (assessment.passMark === undefined || score.pending > 0 || score.max === 0) return undefined;
  return score.points / score.max >= assessment.passMark;
}

export const countsAsCorrect = (item: GradedItem) => item.answered && isPassing(item.feedback.verdict);

/** Answers to record: answered and finally marked (self-reviews are recorded when confirmed). */
export function answerContexts(courseId: string, assessment: Assessment, items: GradedItem[]): AnswerContext[] {
  const mode: PracticeMode = assessment.kind === 'mock-exam' ? 'mock-exam' : 'quiz';
  return items
    .filter((item) => item.answered && item.feedback.verdict !== 'self-review')
    .map((item) => ({
      question: item.question,
      topics: item.question.topics,
      courseId,
      assessmentId: assessment.id,
      mode,
      response: item.response,
      feedback: item.feedback,
      hintsUsed: 0,
      revealed: false,
      selfAssessed: false,
      firstAttemptInSession: true,
    }));
}
