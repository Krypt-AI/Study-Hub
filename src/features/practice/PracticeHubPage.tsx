/**
 * The practice hub: what is due, where you are weakest, quick sessions, mock exams, and how
 * your knowledge splits across the four skills (recognise, recall, explain, apply).
 */
import { ChevronRight, ClipboardCheck } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { Bubble } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useAttempts, useBookmarks, useReviewStates, useTopicMastery } from '@/data/queries';
import type { AttemptRecord, BookmarkRecord, ReviewStateRecord, TopicMasteryRecord } from '@/data/records';
import { useCatalog } from '@/domain/content/load';
import type { Catalog, CourseSummary } from '@/domain/content/types';
import { assessmentUrl } from '@/domain/content/urls';
import { levelCountsBySkill, type MasteryLevel, masteryLevel, SKILL_LABELS, SKILLS } from '@/domain/learning/mastery';
import { dueCountsByCourse, isDue } from '@/domain/learning/due';
import { relativeTime } from '@/lib/dates';
import { DueReviewsSheet } from './DueReviewsSheet';
import { PRACTICE_MODES, type PracticeModeId, practiceUrl, RECENT_ATTEMPTS } from './practiceModes';
import { mistakeRefs, savedRefs, type WeakSpot, weakSpots } from './session/selectPractice';

export default function PracticeHubPage() {
  const catalog = useCatalog();
  const reviews = useReviewStates();
  const mastery = useTopicMastery();
  const attempts = useAttempts(RECENT_ATTEMPTS);
  const bookmarks = useBookmarks();

  const error = [catalog, reviews, mastery, attempts, bookmarks].find((query) => query.error)?.error;
  if (error) return <ErrorState title="Practice could not be loaded" error={error} />;
  if (!catalog.data || !reviews.data || !mastery.data || !attempts.data || !bookmarks.data) return <LoadingState />;
  return <PracticeHub catalog={catalog.data} reviews={reviews.data} mastery={mastery.data} attempts={attempts.data} bookmarks={bookmarks.data} />;
}

interface HubData {
  catalog: Catalog;
  reviews: ReviewStateRecord[];
  mastery: TopicMasteryRecord[];
  attempts: AttemptRecord[];
  bookmarks: BookmarkRecord[];
}

function PracticeHub({ catalog, reviews, mastery, attempts, bookmarks }: HubData) {
  const model = useMemo(() => {
    const now = new Date();
    const courseById = new Map(catalog.courses.map((course) => [course.id, course]));
    const known = <T extends { courseId: string }>(entries: T[]) => entries.filter((entry) => courseById.has(entry.courseId));
    const due = dueCountsByCourse(reviews, now).map((entry) => ({ ...entry, course: courseById.get(entry.courseId) }));
    const upcoming = reviews.filter((review) => !isDue(review, now)).sort((a, b) => Date.parse(a.due) - Date.parse(b.due));
    const lastSat = new Map<string, string>();
    for (const attempt of attempts) if (attempt.assessmentId && !lastSat.has(attempt.assessmentId)) lastSat.set(attempt.assessmentId, attempt.createdAt);
    return {
      courseById,
      due,
      dueTotal: due.reduce((sum, entry) => sum + entry.due, 0),
      nextDue: upcoming[0]?.due,
      spots: known(weakSpots(mastery)),
      counts: {
        weak: known(weakSpots(mastery, { limit: Infinity })).length,
        mistakes: known(mistakeRefs(attempts, Infinity)).length,
        saved: known(savedRefs(bookmarks)).length,
      },
      levels: levelCountsBySkill(mastery),
      lastSat,
    };
  }, [catalog, reviews, mastery, attempts, bookmarks]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Practice" lead="Reviews, weak spots and mock exams. Every answer updates your review schedule and topic mastery." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <DueReviewsSheet title="Due reviews" due={model.due} total={model.dueTotal} nextDue={model.nextDue} />
          <WeakSpotsSheet spots={model.spots} courseById={model.courseById} />
          <SkillsSheet levels={model.levels} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <SessionsSheet counts={model.counts} />
          <ExamsSheet courses={catalog.courses} lastSat={model.lastSat} />
        </div>
      </div>
    </div>
  );
}

function WeakSpotsSheet({ spots, courseById }: { spots: WeakSpot[]; courseById: Map<string, CourseSummary> }) {
  return (
    <Sheet title="Weak spots" aside={spots.length > 0 ? <Link to={practiceUrl('weak')} className="hover:text-ink">Practise all</Link> : undefined}>
      {spots.length === 0 ? (
        <p className="text-sm text-ink-muted">After a few answers per topic, the topics and skills you keep missing are listed here, weakest first.</p>
      ) : (
        <ul className="flex flex-col">
          {spots.map((spot) => {
            const course = courseById.get(spot.courseId);
            const level = masteryLevel({ ema: spot.score, attempts: spot.attempts });
            return (
              <li key={`${spot.topicId}|${spot.skill}`} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <Bubble state={level} title={level} />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{course?.topics.find((topic) => topic.id === spot.topicId)?.title ?? spot.topicId}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {SKILL_LABELS[spot.skill]} · {course?.title}
                  </p>
                </div>
                <span className="tabular text-sm text-ink-muted">{Math.round(spot.score * 100)}%</span>
                <ButtonLink to={practiceUrl('weak', { topic: spot.topicId })} size="sm" variant="ghost">
                  Practise
                </ButtonLink>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

const LEVEL_COLUMNS: Array<{ level: MasteryLevel; label: string }> = [
  { level: 'mastered', label: 'Mastered' },
  { level: 'learning', label: 'Learning' },
  { level: 'weak', label: 'Weak' },
];

const SKILL_MEANING: Record<(typeof SKILLS)[number], string> = {
  recognize: 'pick the right answer',
  recall: 'produce it from memory',
  explain: 'say why in your own words',
  apply: 'use it in a task or code',
};

function SkillsSheet({ levels }: { levels: ReturnType<typeof levelCountsBySkill> }) {
  const practised = SKILLS.some((skill) => LEVEL_COLUMNS.some(({ level }) => levels[skill][level] > 0));
  return (
    <Sheet title="Knowledge by skill">
      {!practised ? (
        <p className="text-sm text-ink-muted">Each answer counts toward one of four skills. Once you have answered a few questions, this shows how many topics you have mastered in each.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-muted">
              <th className="pb-2 text-left font-display font-semibold">Skill</th>
              {LEVEL_COLUMNS.map(({ level, label }) => (
                <th key={level} className="pb-2 text-right font-display font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Bubble state={level} size="sm" /> {label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {SKILLS.map((skill) => (
              <tr key={skill} className="border-t border-rule">
                <td className="py-2 pr-3">
                  <span className="font-medium">{SKILL_LABELS[skill]}</span>
                  <span className="block text-xs text-ink-faint">{SKILL_MEANING[skill]}</span>
                </td>
                {LEVEL_COLUMNS.map(({ level }) => (
                  <td key={level} className="py-2 text-right">
                    {levels[skill][level] || <span className="text-ink-faint">0</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sheet>
  );
}

const QUICK_SESSIONS: Array<{ mode: PracticeModeId; count?: 'weak' | 'mistakes' | 'saved' }> = [
  { mode: 'weak', count: 'weak' },
  { mode: 'mistakes', count: 'mistakes' },
  { mode: 'saved', count: 'saved' },
  { mode: 'quiz' },
];

function SessionsSheet({ counts }: { counts: Record<'weak' | 'mistakes' | 'saved', number> }) {
  return (
    <Sheet title="Quick sessions" padded={false}>
      <ul className="divide-y divide-rule">
        {QUICK_SESSIONS.map(({ mode, count }) => {
          const info = PRACTICE_MODES[mode];
          const value = count ? counts[count] : undefined;
          return (
            <li key={mode}>
              <Link to={practiceUrl(mode)} className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 hover:bg-sheet-2">
                <span className="min-w-0">
                  <span className="block font-medium group-hover:text-print-strong">{info.title}</span>
                  <span className="block text-sm text-ink-muted">{info.description}</span>
                </span>
                <span className="display-numerals text-lg text-ink">{value ?? ''}</span>
                <ChevronRight className="size-4 text-ink-faint" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function ExamsSheet({ courses, lastSat }: { courses: CourseSummary[]; lastSat: Map<string, string> }) {
  const exams = courses.flatMap((course) => course.assessments.map((assessment) => ({ course, assessment })));
  if (exams.length === 0) return null;
  return (
    <Sheet title="Mock exams and quizzes" padded={false}>
      <ul className="divide-y divide-rule">
        {exams.map(({ course, assessment }) => {
          const sat = lastSat.get(assessment.id);
          return (
            <li key={assessment.id} className="flex items-center gap-3 px-4 py-3">
              <ClipboardCheck className="size-4 shrink-0 text-print" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{assessment.title}</p>
                <p className="truncate text-xs text-ink-faint">
                  {course.title} · {sat ? `last sat ${relativeTime(sat)}` : 'not sat yet'}
                </p>
              </div>
              {assessment.kind === 'mock-exam' && <Tag>timed</Tag>}
              <ButtonLink to={assessmentUrl(course.id, assessment.id)} size="sm">
                Open
              </ButtonLink>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
