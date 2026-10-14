/**
 * Marking a finished exam: each answered question is judged once, unanswered questions
 * score zero, and each question's score times its marks is summed per section. In a section
 * where the learner answers only some questions ("pilih satu"), the first ones answered count. Only answered questions are
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
  /** Counts towards the score: false for questions left out of a section where only some are answered. */
  counted: boolean;
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
  const counted = countedQuestions(section, answers);
  // One at a time: code answers share a runtime per language.
  for (const question of section.questions) {
    const response = answers[question.id] ?? emptyResponse(question);
    const isCounted = counted.has(question.id);
    if (!hasAnswer(response)) {
      items.push({ question, response, answered: false, feedback: unansweredFeedback(question), counted: isCounted });
      continue;
    }
    const { feedback, run } = await judgeResponse(question, response);
    items.push({ question, response, answered: true, feedback, run, counted: isCounted });
  }
  return { section, items, timeUsedMs };
}

/** Every question, or in a "choose" section the first ones answered, topped up with unanswered ones when too few are. */
function countedQuestions(section: AssessmentSection, answers: Readonly<Record<string, Response>>): Set<string> {
  if (!section.choose) return new Set(section.questions.map((question) => question.id));
  const answered = (question: Question) => {
    const response = answers[question.id];
    return response !== undefined && hasAnswer(response);
  };
  const ordered = [...section.questions.filter(answered), ...section.questions.filter((question) => !answered(question))];
  return new Set(ordered.slice(0, section.choose).map((question) => question.id));
}

/** The marks a question carries on its paper. */
export const marksOf = (question: Question) => question.marks ?? 1;

export function scoreItems(items: GradedItem[]): Score {
  const score: Score = { points: 0, max: 0, pending: 0 };
  for (const item of items.filter((candidate) => candidate.counted)) {
    score.max += marksOf(item.question);
    if (item.feedback.verdict === 'self-review') score.pending++;
    else score.points += item.feedback.score * marksOf(item.question);
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
