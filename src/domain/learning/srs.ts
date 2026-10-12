/**
 * Spaced repetition with FSRS (Free Spaced Repetition Scheduler, via ts-fsrs).
 * Feedback is converted to an FSRS rating, and the item's next review date follows.
 */
import { type Card, createEmptyCard, fsrs, generatorParameters, type Grade, Rating } from 'ts-fsrs';
import type { ReviewStateRecord, SchedulerCard } from '@/data/records';
import type { Feedback } from '@/domain/evaluation/types';

export interface RatingContext {
  hintsUsed: number;
  /** The learner revealed the answer instead of answering. */
  revealed: boolean;
}

/**
 * Again: wrong, or the answer was revealed.
 * Hard:  right with a slip, with hints, or only partly right.
 * Good:  right without help.
 */
export function ratingFor(feedback: Pick<Feedback, 'verdict' | 'score'>, context: RatingContext): Grade {
  if (context.revealed) return Rating.Again;
  switch (feedback.verdict) {
    case 'correct':
      return context.hintsUsed > 0 ? Rating.Hard : Rating.Good;
    case 'almost':
      return Rating.Hard;
    case 'partial':
    case 'self-review':
      return feedback.score >= 0.5 ? Rating.Hard : Rating.Again;
    case 'incorrect':
      return Rating.Again;
  }
}

function toSchedulerCard(card: Card): SchedulerCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
  };
}

function fromSchedulerCard(card: SchedulerCard): Card {
  return {
    ...card,
    due: new Date(card.due),
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  } as Card;
}

export interface ReviewItemRef {
  itemId: string;
  courseId?: string;
  lessonId?: string;
  topics: string[];
}

export function scheduleReview(
  previous: ReviewStateRecord | undefined,
  item: ReviewItemRef,
  rating: Grade,
  now: Date,
  desiredRetention = 0.9,
): ReviewStateRecord {
  const scheduler = fsrs(generatorParameters({ request_retention: desiredRetention, enable_fuzz: true }));
  const card = previous ? fromSchedulerCard(previous.card) : createEmptyCard(now);
  const next = scheduler.next(card, now, rating).card;
  return {
    itemId: item.itemId,
    courseId: item.courseId ?? previous?.courseId,
    lessonId: item.lessonId ?? previous?.lessonId,
    topics: item.topics.length ? item.topics : (previous?.topics ?? []),
    card: toSchedulerCard(next),
    due: next.due.toISOString(),
    lastRating: rating as 1 | 2 | 3 | 4,
    updatedAt: now.toISOString(),
  };
}
