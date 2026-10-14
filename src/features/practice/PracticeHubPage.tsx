/**
 * Practice in two steps: first the subject, then everything waiting in it: due reviews, weak spots,
 * recent mistakes, saved questions and a quiz, and how its knowledge splits across the four skills.
 */
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { type AreaEntry, AreaBack, AreaIndex } from '@/components/ui/AreaIndex';
import { Bubble } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useAttempts, useBookmarks, useLessonProgress, useReviewStates, useTopicMastery } from '@/data/queries';
import { useCatalog } from '@/domain/content/load';
import type { CourseSummary } from '@/domain/content/types';
import { type MasteryLevel, masteryLevel, SKILL_LABELS, SKILLS } from '@/domain/learning/mastery';
import { relativeTime } from '@/lib/dates';
import { PRACTICE_MODES, type PracticeModeId, practiceUrl, RECENT_ATTEMPTS } from './practiceModes';
import type { WeakSpot } from './session/selectPractice';
import { type PracticeRecords, practisedCourseIds, type SubjectPractice, subjectPractice } from './subjectPractice';

export default function PracticeHubPage() {
  const catalog = useCatalog();
  const reviews = useReviewStates();
  const mastery = useTopicMastery();
  const attempts = useAttempts(RECENT_ATTEMPTS);
  const bookmarks = useBookmarks();
  const progress = useLessonProgress();
  const [params] = useSearchParams();

  const error = [catalog, reviews, mastery, attempts, bookmarks, progress].find((query) => query.error)?.error;
  if (error) return <ErrorState title="Practice could not be loaded" error={error} />;
  if (!catalog.data || !reviews.data || !mastery.data || !attempts.data || !bookmarks.data || !progress.data) return <LoadingState />;
  const records: PracticeRecords = { reviews: reviews.data, mastery: mastery.data, attempts: attempts.data, bookmarks: bookmarks.data };
  const course = catalog.data.courses.find((candidate) => candidate.id === params.get('course'));
  if (course) return <SubjectPage course={course} records={records} />;
  const practised = practisedCourseIds(records, progress.data.map((record) => record.courseId));
  return <SubjectChoice courses={catalog.data.courses.filter((candidate) => practised.has(candidate.id))} records={records} />;
}

/** "12 due, 3 weak spots", or what to do next. */
function waitingNote(practice: SubjectPractice): string | undefined {
  const parts = [practice.due ? `${practice.due} due` : '', practice.counts.weak ? `${practice.counts.weak} weak spot${practice.counts.weak === 1 ? '' : 's'}` : ''].filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

function SubjectChoice({ courses, records }: { courses: CourseSummary[]; records: PracticeRecords }) {
  const entries = useMemo(() => {
    const now = new Date();
    return courses
      .map((course) => ({ course, practice: subjectPractice(course.id, records, now) }))
      .sort((a, b) => b.practice.due - a.practice.due || a.course.title.localeCompare(b.course.title))
      .map(({ course, practice }): AreaEntry => ({
        id: course.id,
        title: course.title,
        description: practice.due || practice.counts.weak ? 'Reviews, weak spots and quizzes for this subject.' : 'Nothing waiting right now: take a quiz or revise saved questions.',
        note: waitingNote(practice),
        to: `/practice?course=${course.id}`,
      }));
  }, [courses, records]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Practice" lead="Choose a subject to see what is waiting in it." />
      {entries.length === 0 ? (
        <EmptyState title="Nothing to practise yet" action={<ButtonLink to="/courses">Choose a course</ButtonLink>}>
          Answer a few questions in a lesson first: they come back here to review, and the topics you miss become weak spots.
        </EmptyState>
      ) : (
        <AreaIndex label="Subjects" entries={entries} />
      )}
    </div>
  );
}

function SubjectPage({ course, records }: { course: CourseSummary; records: PracticeRecords }) {
  const practice = useMemo(() => subjectPractice(course.id, records), [course.id, records]);
  return (
    <div className="mx-auto max-w-6xl">
      <AreaBack to="/practice" label="All subjects" />
      <PageHeader title={course.title} lead="Every answer updates your review schedule and topic mastery." />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SessionsSheet courseId={course.id} practice={practice} />
          <WeakSpotsSheet spots={practice.spots} course={course} />
        </div>
        <SkillsSheet levels={practice.levels} />
      </div>
    </div>
  );
}

const SESSIONS: PracticeModeId[] = ['review', 'weak', 'mistakes', 'saved', 'quiz'];

/** The subject's sessions with how many questions each holds; empty ones say so instead of starting. */
function SessionsSheet({ courseId, practice }: { courseId: string; practice: SubjectPractice }) {
  const count: Partial<Record<PracticeModeId, number>> = { review: practice.due, weak: practice.counts.weak, mistakes: practice.counts.mistakes, saved: practice.counts.saved };
  return (
    <Sheet title="Sessions" padded={false}>
      <ul className="divide-y divide-rule">
        {SESSIONS.map((mode) => {
          const info = PRACTICE_MODES[mode];
          const value = count[mode];
          const empty = value === 0;
          const detail =
            mode === 'review' && empty && practice.nextDue
              ? `Nothing due. The next review is due ${relativeTime(practice.nextDue)}.`
              : mode === 'quiz'
                ? 'A random set of questions from this subject.'
                : info.description;
          return (
            <li key={mode}>
              <Link
                to={practiceUrl(mode, { course: courseId })}
                aria-disabled={empty || undefined}
                className={empty ? 'pointer-events-none grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 opacity-60' : 'group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-3.5 hover:bg-sheet-2'}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium group-hover:text-print-strong">
                    {info.title}
                    {mode === 'review' && practice.overdue > 0 && <Tag tone="wrong">{practice.overdue} overdue</Tag>}
                  </span>
                  <span className="block text-sm text-ink-muted">{detail}</span>
                </span>
                {value !== undefined && <span className="display-numerals text-xl text-ink">{value}</span>}
                {!empty && <ChevronRight className="size-4 text-ink-faint" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function WeakSpotsSheet({ spots, course }: { spots: WeakSpot[]; course: CourseSummary }) {
  return (
    <Sheet title="Weak spots">
      {spots.length === 0 ? (
        <p className="text-sm text-ink-muted">After a few answers per topic, the topics and skills you keep missing are listed here, weakest first.</p>
      ) : (
        <ul className="flex flex-col">
          {spots.map((spot) => {
            const level = masteryLevel({ ema: spot.score, attempts: spot.attempts });
            return (
              <li key={`${spot.topicId}|${spot.skill}`} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <Bubble state={level} title={level} />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{course.topics.find((topic) => topic.id === spot.topicId)?.title ?? spot.topicId}</p>
                  <p className="truncate text-xs text-ink-faint">{SKILL_LABELS[spot.skill]}</p>
                </div>
                <span className="tabular text-sm text-ink-muted">{Math.round(spot.score * 100)}%</span>
                <ButtonLink to={practiceUrl('weak', { course: course.id, topic: spot.topicId })} size="sm" variant="ghost">
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

function SkillsSheet({ levels }: { levels: SubjectPractice['levels'] }) {
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
