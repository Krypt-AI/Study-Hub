/**
 * Records one answered question: the attempt itself, the review schedule, topic mastery,
 * daily activity and lesson progress. This is the single write path for answers, so
 * lessons, reviews, quizzes and mock exams all update progress the same way.
 */
import type { AttemptRecord, PracticeMode, ReviewStateRecord } from '@/data/records';
import type { StudyRepository } from '@/data/repository';
import type { Question } from '@/domain/content/types';
import { type Feedback, isPassing, type Response } from '@/domain/evaluation/types';
import { dayKey } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { updateMastery } from './mastery';
import { ratingFor, scheduleReview } from './srs';

export interface AnswerContext {
  question: Question;
  /** Topics credited for this answer (the question's own, else its lesson's). */
  topics: string[];
  courseId?: string;
  lessonId?: string;
  assessmentId?: string;
  mode: PracticeMode;
  response: Response;
  feedback: Feedback;
  hintsUsed: number;
  revealed: boolean;
  selfAssessed: boolean;
  /** False for retries within the same session: they are practice and never lower the schedule. */
  firstAttemptInSession: boolean;
  durationMs?: number;
}

export interface RecordedAnswer {
  attempt: AttemptRecord;
  review?: ReviewStateRecord;
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Records answers one at a time, in the order given: each write reads and updates review
 * state, mastery and lesson progress, so overlapping writes could lose an update.
 */
export function recordAnswer(repository: StudyRepository, context: AnswerContext, now: Date = new Date()): Promise<RecordedAnswer> {
  const write = queue.catch(() => undefined).then(() => writeAnswer(repository, context, now));
  queue = write;
  return write;
}

async function writeAnswer(repository: StudyRepository, context: AnswerContext, now: Date): Promise<RecordedAnswer> {
  const at = now.toISOString();
  const passing = isPassing(context.feedback.verdict) && !context.revealed;
  const attempt: AttemptRecord = {
    id: newId(),
    questionId: context.question.id,
    courseId: context.courseId,
    lessonId: context.lessonId,
    assessmentId: context.assessmentId,
    questionType: context.question.type,
    skill: context.question.skill,
    topics: context.topics,
    mode: context.mode,
    response: context.response,
    verdict: context.feedback.verdict,
    score: context.revealed ? 0 : context.feedback.score,
    hintsUsed: context.hintsUsed,
    revealed: context.revealed,
    selfAssessed: context.selfAssessed,
    countsForScheduling: context.firstAttemptInSession,
    durationMs: context.durationMs,
    createdAt: at,
  };
  await repository.addAttempt(attempt);

  let review: ReviewStateRecord | undefined;
  if (context.firstAttemptInSession) {
    const settings = await repository.getSettings();
    const previous = await repository.getReviewState(context.question.id);
    const rating = ratingFor(context.feedback, { hintsUsed: context.hintsUsed, revealed: context.revealed });
    review = scheduleReview(
      previous,
      { itemId: context.question.id, courseId: context.courseId, lessonId: context.lessonId, topics: context.topics },
      rating,
      now,
      settings.desiredRetention,
    );
    await repository.saveReviewState(review);
  }

  if (context.topics.length) {
    const existing = new Map((await repository.listTopicMastery()).map((record) => [record.key, record]));
    const updates = context.topics.map((topicId) =>
      updateMastery(existing.get(`${topicId}|${context.question.skill}`), {
        topicId,
        skill: context.question.skill,
        courseId: context.courseId,
        score: attempt.score,
        passing,
        weight: context.firstAttemptInSession ? 'first' : 'retry',
        at,
      }),
    );
    await repository.saveTopicMastery(updates);
  }

  await repository.recordActivity(dayKey(now), { attempts: 1, correct: passing ? 1 : 0 });

  if (context.lessonId && context.courseId) {
    await recordLessonAnswer(repository, context.courseId, context.lessonId, context.question.id, passing, at);
  }

  return { attempt, review };
}

async function recordLessonAnswer(
  repository: StudyRepository,
  courseId: string,
  lessonId: string,
  questionId: string,
  passing: boolean,
  at: string,
): Promise<void> {
  const progress = await repository.getLessonProgress(lessonId);
  const answered = new Set(progress?.answeredQuestionIds ?? []);
  const correct = new Set(progress?.correctQuestionIds ?? []);
  answered.add(questionId);
  if (passing) correct.add(questionId);
  await repository.saveLessonProgress({
    lessonId,
    courseId,
    status: progress?.status ?? 'in-progress',
    answeredQuestionIds: [...answered],
    correctQuestionIds: [...correct],
    lastBlockIndex: progress?.lastBlockIndex ?? 0,
    startedAt: progress?.startedAt ?? at,
    updatedAt: at,
    completedAt: progress?.completedAt,
  });
}
