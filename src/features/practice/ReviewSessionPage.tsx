/**
 * Practice outside lessons: due reviews, weak spots, recent mistakes, saved questions and
 * mixed quizzes. The questions are chosen once when the session opens and stay fixed while
 * each answer reschedules reviews and updates mastery behind it.
 */
import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { BubbleStrip } from '@/components/ui/Bubble';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useAttempts, useBookmarks, useLessonProgress, useReviewStates, useSettings, useTopicMastery } from '@/data/queries';
import { contentLanguage } from '@/domain/content/language';
import { useCatalog, useCourses } from '@/domain/content/load';
import { findLesson, topicTitle } from '@/domain/content/navigation';
import type { Catalog, Course } from '@/domain/content/types';
import { assessmentUrl, courseUrl, lessonUrl } from '@/domain/content/urls';
import { relativeTime } from '@/lib/dates';
import { isPracticeModeId, PRACTICE_MODES, type PracticeModeId, practiceUrl, RECENT_ATTEMPTS } from './practiceModes';
import { QuestionCard } from './QuestionCard';
import { buildItems, courseIdsOf, type LearnerRecords, planSession, type SessionPlan } from './session/practicePlan';
import { type PracticeSession, type SessionItem, usePracticeSession } from './session/usePracticeSession';
import { CourseLoadError } from '@/features/auth/LockedContent';

export default function ReviewSessionPage() {
  const { mode } = useParams();
  const [searchParams] = useSearchParams();
  const [round, setRound] = useState(0);
  if (!isPracticeModeId(mode)) return <ErrorState title="Unknown practice mode" error={`There is no practice mode called "${mode ?? ''}".`} />;
  // A new key starts a fresh session: another mode, other filters, or "another round".
  return <PracticeLoader key={`${mode}?${searchParams.toString()}#${round}`} mode={mode} params={searchParams} onRestart={() => setRound((value) => value + 1)} />;
}

interface SessionProps {
  mode: PracticeModeId;
  params: URLSearchParams;
  onRestart: () => void;
}

function PracticeLoader({ mode, params, onRestart }: SessionProps) {
  const catalog = useCatalog();
  const settings = useSettings();
  const reviews = useReviewStates();
  const mastery = useTopicMastery();
  const attempts = useAttempts(RECENT_ATTEMPTS);
  const bookmarks = useBookmarks();
  const progress = useLessonProgress(params.get('course') ?? undefined);

  const error = [catalog, settings, reviews, mastery, attempts, bookmarks, progress].find((query) => query.error)?.error;
  if (error) return <ErrorState title="Practice could not be prepared" error={error} />;
  if (!catalog.data || !settings.data || !reviews.data || !mastery.data || !attempts.data || !bookmarks.data || !progress.data) return <LoadingState />;

  const learner: LearnerRecords = {
    reviews: reviews.data,
    mastery: mastery.data,
    attempts: attempts.data,
    bookmarks: bookmarks.data,
    progress: progress.data,
    settings: settings.data,
  };
  const known = new Set(catalog.data.courses.map((course) => course.id));
  return <PlannedSession mode={mode} params={params} onRestart={onRestart} catalog={catalog.data} initialPlan={planSession(mode, params, learner, known)} />;
}

function PlannedSession({ initialPlan, catalog, ...props }: SessionProps & { initialPlan: SessionPlan; catalog: Catalog }) {
  // The plan is fixed for the session: answering changes the records it was made from.
  const [plan] = useState(initialPlan);
  const courseIds = useMemo(() => courseIdsOf(plan), [plan]);
  const { courses, pending, error } = useCourses(courseIds);

  if (error) return <CourseLoadError title="Course content could not be loaded" error={error} />;
  if (pending) return <LoadingState label="Preparing your questions…" />;
  if (plan.kind === 'choose-course') return <QuizCoursePicker catalog={catalog} />;
  return <SessionRun {...props} plan={plan} courses={courses} />;
}

function SessionRun({ mode, params, onRestart, plan, courses }: SessionProps & { plan: SessionPlan; courses: Map<string, Course> }) {
  const [{ items, missing }] = useState(() => buildItems(plan, courses));
  const session = usePracticeSession(items, PRACTICE_MODES[mode].recordAs);
  const info = PRACTICE_MODES[mode];
  const topicId = params.get('topic');
  const topicCourse = topicId ? [...courses.values()].find((course) => course.topics.some((topic) => topic.id === topicId)) : undefined;
  const lead = topicId && topicCourse ? `Topic: ${topicTitle(topicCourse, topicId)} (${topicCourse.title})` : mode === 'quiz' ? `From ${[...courses.values()][0]?.title ?? 'one course'}` : info.description;

  const header = (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
        <Link to="/practice" className="hover:text-ink">
          Practice
        </Link>
      </nav>
      <PageHeader title={info.title} lead={lead} />
    </>
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        {header}
        <EmptySession mode={mode} plan={plan} />
      </div>
    );
  }

  const { item } = session;
  const course = item?.courseId ? courses.get(item.courseId) : undefined;
  const done = session.summary.answered === items.length;

  return (
    <div className="mx-auto max-w-4xl">
      {header}
      {missing > 0 && (
        <p className="mb-4 text-sm text-ink-muted">
          {missing} question{missing > 1 ? 's are' : ' is'} no longer in {missing > 1 ? 'their courses' : 'its course'} and {missing > 1 ? 'were' : 'was'} skipped.
        </p>
      )}
      {done && <SessionSummary mode={mode} summary={session.summary} total={items.length} onRestart={onRestart} />}
      <Sheet title="Answer sheet" aside={<span className="tabular">{session.summary.answered} / {items.length} answered</span>}>
        <div className="flex flex-col gap-5">
          <BubbleStrip
            states={session.stripStates}
            animateIndex={session.justMarked}
            selectedIndex={session.index}
            onSelect={session.goTo}
            label="Answer strip: choose a question"
          />
          <QuestionCard session={session} contentLang={contentLanguage(course)} context={item && <ItemOrigin item={item} course={course} />} />
        </div>
      </Sheet>
    </div>
  );
}

/** Where the current question comes from, linking back to it in context. */
function ItemOrigin({ item, course }: { item: SessionItem; course?: Course }) {
  if (!course) return null;
  const lesson = item.lessonId ? findLesson(course, item.lessonId)?.lesson : undefined;
  const assessment = item.assessmentId ? course.assessments.find((candidate) => candidate.id === item.assessmentId) : undefined;
  const target = lesson
    ? { to: `${lessonUrl(course.id, lesson.id)}?question=${encodeURIComponent(item.question.id)}`, label: lesson.title }
    : assessment
      ? { to: assessmentUrl(course.id, assessment.id), label: assessment.title }
      : { to: courseUrl(course.id), label: course.title };
  return (
    <Link to={target.to} className="max-w-full truncate text-sm text-ink-muted hover:text-ink" lang={contentLanguage(course)}>
      {course.title} · {target.label}
    </Link>
  );
}

function SessionSummary({ mode, summary, total, onRestart }: { mode: PracticeModeId; summary: PracticeSession['summary']; total: number; onRestart: () => void }) {
  return (
    <Sheet title="Session complete" className="mb-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <dl className="flex gap-8">
          {[
            { label: 'Correct', value: summary.correct, tone: 'text-correct' },
            { label: 'Almost', value: summary.almost, tone: 'text-slip' },
            { label: 'Not yet', value: summary.wrong, tone: 'text-wrong' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <dt className="text-sm text-ink-muted">{stat.label}</dt>
              <dd className={`display-numerals text-3xl font-semibold ${stat.tone}`}>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-[40ch] text-sm text-ink-muted">
          All {total} answered. Questions you missed come back sooner; the ones you knew come back later.
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          {summary.wrong > 0 && mode !== 'mistakes' && <ButtonLink to={practiceUrl('mistakes')}>Practise mistakes</ButtonLink>}
          <Button icon={<RotateCcw className="size-4" />} onClick={onRestart}>
            {mode === 'review' ? 'Check for more' : 'Another round'}
          </Button>
          <ButtonLink to="/practice" variant="primary">
            Back to practice
          </ButtonLink>
        </div>
      </div>
    </Sheet>
  );
}

const EMPTY_COPY: Record<PracticeModeId, { title: string; body: string }> = {
  review: { title: 'Nothing is due right now', body: 'Questions you answer in lessons come back here when they are due for review.' },
  weak: { title: 'No weak spots yet', body: 'After a few answers per topic, the topics and skills you keep missing are collected here.' },
  mistakes: { title: 'No recent mistakes', body: 'Questions you answer wrongly or reveal are listed here until you answer them correctly.' },
  saved: { title: 'No saved questions', body: 'Use the bookmark button on any question to save it for revision.' },
  quiz: { title: 'This course has no practice questions yet', body: 'Choose another course for a quiz.' },
};

function EmptySession({ mode, plan }: { mode: PracticeModeId; plan: SessionPlan }) {
  const copy = EMPTY_COPY[mode];
  const nextDue = plan.kind === 'refs' ? plan.nextDue : undefined;
  return (
    <EmptyState title={copy.title} action={<ButtonLink to="/practice">Back to practice</ButtonLink>}>
      {copy.body}
      {nextDue && <> The next review is due {relativeTime(nextDue)}.</>}
    </EmptyState>
  );
}

function QuizCoursePicker({ catalog }: { catalog: Catalog }) {
  const courses = catalog.courses.filter((course) => course.questionCount > 0);
  return (
    <div className="mx-auto max-w-4xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
        <Link to="/practice" className="hover:text-ink">
          Practice
        </Link>
      </nav>
      <PageHeader title="Mixed quiz" lead="Choose a course. The quiz draws from lessons you have started, or from the whole course before you start." />
      <Sheet padded={false}>
        <ul className="divide-y divide-rule">
          {courses.map((course) => (
            <li key={course.id}>
              <Link to={practiceUrl('quiz', { course: course.id })} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-sheet-2">
                <span className="truncate font-medium">{course.title}</span>
                <span className="tabular shrink-0 text-xs text-ink-faint">{course.questionCount} questions</span>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
