/**
 * Topic mastery per skill (recognise / recall / explain / apply), kept as an exponential
 * moving average of scores so recent answers matter most and mistakes can be recovered.
 */
import type { Timestamp, TopicMasteryRecord } from '@/data/records';
import type { Skill } from '@/domain/content/types';

/** Weight of a new score: first attempts count fully, retries in the same session count less. */
const ALPHA = { first: 0.35, retry: 0.15 } as const;

export const masteryKey = (topicId: string, skill: Skill) => `${topicId}|${skill}`;

export interface MasteryUpdate {
  topicId: string;
  skill: Skill;
  courseId?: string;
  score: number;
  passing: boolean;
  weight: keyof typeof ALPHA;
  at: Timestamp;
}

export function updateMastery(previous: TopicMasteryRecord | undefined, update: MasteryUpdate): TopicMasteryRecord {
  const ema = previous ? previous.ema + ALPHA[update.weight] * (update.score - previous.ema) : update.score;
  return {
    key: masteryKey(update.topicId, update.skill),
    topicId: update.topicId,
    skill: update.skill,
    courseId: update.courseId ?? previous?.courseId,
    ema: Math.round(ema * 1000) / 1000,
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (update.passing ? 1 : 0),
    lastAttemptAt: update.at,
  };
}

export type MasteryLevel = 'new' | 'learning' | 'weak' | 'mastered';

export function masteryLevel(record: Pick<TopicMasteryRecord, 'ema' | 'attempts'> | undefined): MasteryLevel {
  if (!record || record.attempts === 0) return 'new';
  if (record.attempts >= 3 && record.ema >= 0.85) return 'mastered';
  if (record.attempts >= 2 && record.ema < 0.6) return 'weak';
  return 'learning';
}

/** Worth targeted practice: weak, or still unsettled after a few answers. */
export function needsPractice(record: Pick<TopicMasteryRecord, 'ema' | 'attempts'>): boolean {
  const level = masteryLevel(record);
  return level === 'weak' || (level === 'learning' && record.attempts >= 2);
}

export const SKILL_LABELS: Record<Skill, string> = {
  recognize: 'Recognise',
  recall: 'Recall',
  explain: 'Explain',
  apply: 'Apply',
};

export const SKILLS: readonly Skill[] = ['recognize', 'recall', 'explain', 'apply'];

/** How many practised topics sit at each level, per skill. */
export function levelCountsBySkill(records: Pick<TopicMasteryRecord, 'skill' | 'ema' | 'attempts'>[]): Record<Skill, Record<MasteryLevel, number>> {
  const counts = Object.fromEntries(SKILLS.map((skill) => [skill, { new: 0, learning: 0, weak: 0, mastered: 0 }])) as Record<Skill, Record<MasteryLevel, number>>;
  for (const record of records) counts[record.skill][masteryLevel(record)]++;
  return counts;
}
