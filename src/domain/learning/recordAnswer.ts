/**
 * Records one answered question: the attempt itself, the review schedule, topic mastery,
 * daily activity and lesson progress. This is the single write path for answers, so
 * lessons, reviews, quizzes and mock exams all update progress the same way. The subject's
 * study plan decides whether the answer is scheduled for review and counts towards mastery.
 */
import type { AttemptRecord, PracticeMode, ReviewStateRecord, TopicMasteryRecord } from '@/data/records';
import type { StudyRepository } from '@/data/repository';
import type { Question } from '@/domain/content/types';
import { type Feedback, isPassing, type Response } from '@/domain/evaluation/types';
import { dayKey } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { masteryKey, updateMastery } from './mastery';
import { ratingFor, scheduleReview } from './srs';
import { schedulesReviews, tracksMastery } from './studyPlan';

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

/** The answer and the state it was applied to, so its mark can still be corrected. */
interface AnswerBaseline {
  context: AnswerContext;
  /** Position among all answers written, to tell whether this one is still the latest. */
  sequence: number;
  recordedAt: Date;
  /** Review state and mastery as they were just before the answer was recorded. */
  review?: ReviewStateRecord;
  mastery: ReadonlyMap<string, TopicMasteryRecord>;
}

export interface RecordedAnswer {
  attempt: AttemptRecord;
  review?: ReviewStateRecord;
  baseline: AnswerBaseline;
}

let queue: Promise<unknown> = Promise.resolve();
let latestSequence = 0;

/**
 * Runs writes one at a time, in the order given: each write reads and updates review
 * state, mastery and lesson progress, so overlapping writes could lose an update.
 */
function enqueue<T>(write: () => Promise<T>): Promise<T> {
  const result = queue.catch(() => undefined).then(write);
  queue = result;
  return result;
}

export function recordAnswer(repository: StudyRepository, context: AnswerContext, now: Date = new Date()): Promise<RecordedAnswer> {
  return enqueue(async () => applyAnswer(repository, await readBaseline(repository, context, now)));
}

/** True while no other answer has been recorded since this one. */
export const isLatestAnswer = (recorded: RecordedAnswer) => recorded.baseline.sequence === latestSequence;

/**
 * Re-marks the most recent answer as if it had been marked that way at the time (e.g. the
 * learner's "I was right"): the attempt is replaced, and the schedule and mastery are
 * recomputed from the state the answer was applied to, so nothing is counted twice. Only
 * the latest answer can be re-marked, since later answers were built on the old mark.
 */
export function correctLatestAnswer(repository: StudyRepository, recorded: RecordedAnswer, context: AnswerContext): Promise<RecordedAnswer> {
  return enqueue(async () => {
    if (!isLatestAnswer(recorded)) throw new Error('Only your most recent answer can be re-marked.');
    return applyAnswer(repository, { ...recorded.baseline, context }, recorded.attempt);
  });
}

async function readBaseline(repository: StudyRepository, context: AnswerContext, now: Date): Promise<AnswerBaseline> {
  const review = context.firstAttemptInSession ? await repository.getReviewState(context.question.id) : undefined;
  const keys = new Set(context.topics.map((topicId) => masteryKey(topicId, context.question.skill)));
  const mastery = keys.size ? (await repository.listTopicMastery()).filter((record) => keys.has(record.key)) : [];
  latestSequence += 1;
  return { context, sequence: latestSequence, recordedAt: now, review, mastery: new Map(mastery.map((record) => [record.key, record])) };
}

const countsAsCorrect = (attempt: Pick<AttemptRecord, 'verdict' | 'revealed'>) => isPassing(attempt.verdict) && !attempt.revealed;

/** Writes an answer on top of its baseline; `replacing` is the attempt being re-marked, if any. */
async function applyAnswer(repository: StudyRepository, baseline: AnswerBaseline, replacing?: AttemptRecord): Promise<RecordedAnswer> {
  const { context, recordedAt: now } = baseline;
  const at = now.toISOString();
  const attempt: AttemptRecord = {
    id: replacing?.id ?? newId(),
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
  const passing = countsAsCorrect(attempt);
  await (replacing ? repository.replaceAttempt(attempt) : repository.addAttempt(attempt));

  const settings = await repository.getSettings();
  let review: ReviewStateRecord | undefined;
  if (context.firstAttemptInSession && schedulesReviews(settings.studyPlans, context.courseId)) {
    const rating = ratingFor(context.feedback, { hintsUsed: context.hintsUsed, revealed: context.revealed });
    review = scheduleReview(
      baseline.review,
      { itemId: context.question.id, courseId: context.courseId, lessonId: context.lessonId, topics: context.topics },
      rating,
      now,
      settings.desiredRetention,
    );
    await repository.saveReviewState(review);
  }

  if (context.topics.length && tracksMastery(settings.studyPlans, context.courseId)) {
    const updates = context.topics.map((topicId) =>
      updateMastery(baseline.mastery.get(masteryKey(topicId, context.question.skill)), {
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

  if (!replacing) {
    await repository.recordActivity(dayKey(now), { attempts: 1, correct: passing ? 1 : 0 });
  } else if (passing !== countsAsCorrect(replacing)) {
    await repository.recordActivity(dayKey(now), { correct: passing ? 1 : -1 });
  }

  if (context.lessonId && context.courseId) {
    await recordLessonAnswer(repository, context.courseId, context.lessonId, context.question.id, passing, at);
  }

  return { attempt, review, baseline };
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
