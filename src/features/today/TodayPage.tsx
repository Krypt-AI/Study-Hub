/**
 * Today: the session's answer sheet. What is due, where you stopped, how much of the
 * goal is filled, which topics need practice, and today's classes from the calendar. Resume is
 * always the single latest lesson, with the bookmarked courses beneath it; due reviews and weak topics cover only the subjects whose study plan
 * includes them (domain/learning/studyPlan.ts), so a subject used only as material adds nothing here.
 */
import { ArrowRight, Play } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { Bubble, type BubbleState, BubbleStrip } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import {
  useActivityDays,
  useBookmarks,
  useLessonProgress,
  useSettings,
  useTopicMastery,
} from '@/data/queries';
import type { LessonProgressRecord } from '@/data/records';
import { useCourse } from '@/domain/content/load';
import { findLesson } from '@/domain/content/navigation';
import type { CourseSummary } from '@/domain/content/types';
import { courseUrl, lessonUrl } from '@/domain/content/urls';
import { learnerYearFirst } from '@/domain/content/visibility';
import { SKILL_LABELS } from '@/domain/learning/mastery';
import { withMasteryTracked } from '@/domain/learning/studyPlan';
import { ComingUpSheet } from '@/features/calendar/ComingUpSheet';
import { LearnerSwitcher } from '@/features/learners/LearnerSwitcher';
import { DueReviewsSheet } from '@/features/practice/DueReviewsSheet';
import { usePlannedReviewStates, useVisibleCatalog, type VisibleCatalog } from '@/features/profile/useVisibility';
import { addDays, dayKey, parseDayKey } from '@/lib/dates';
import { computeTodayModel, type ResumeTarget, type TodayModel, type WeakTopic, type WeekDay } from './todayModel';

const STRIP_LIMIT = 40;

export default function TodayPage() {
  const catalog = useVisibleCatalog();
  const settings = useSettings();
  const progress = useLessonProgress();
  const reviews = usePlannedReviewStates();
  const mastery = useTopicMastery();
  const activity = useActivityDays(addDays(dayKey(), -400));
  const bookmarks = useBookmarks();

  const bookmarkedCourseIds = useMemo(
    () => (bookmarks.data ?? []).filter((bookmark) => bookmark.type === 'course').map((bookmark) => bookmark.id),
    [bookmarks.data],
  );
  const model = useMemo(() => {
    if (!catalog.data || !settings.data || !progress.data || !reviews.data || !mastery.data || !activity.data) return undefined;
    return computeTodayModel({
      catalog: catalog.data,
      settings: settings.data,
      // All progress: Resume is the latest lesson, whichever subject it belongs to.
      progress: progress.data,
      reviews: reviews.data,
      mastery: withMasteryTracked(mastery.data, settings.data.studyPlans),
      activity: activity.data,
    });
  }, [catalog.data, settings.data, progress.data, reviews.data, mastery.data, activity.data]);

  if (catalog.error) return <ErrorState title="Course content is not built yet" error={catalog.error} onRetry={() => void catalog.refetch()} />;
  if (!model || !catalog.data) return <LoadingState />;

  const today = new Date();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-[2rem] leading-tight font-semibold">Today</h1>
            <LearnerSwitcher />
          </div>
          <p className="mt-1 text-ink-muted">
            {today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            {model.streak.current > 0 && (
              <>
                {' · '}
                <span className="text-ink">{model.streak.current}-day streak</span>
                {!model.streak.activeToday && ' (study today to keep it)'}
              </>
            )}
          </p>
        </div>
        <GoalStrip model={model} />
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {model.resume ? (
            <>
              <ResumeSheet resume={model.resume} />
              {bookmarkedCourseIds.length > 0 && <StartHere catalog={catalog.data} bookmarked={bookmarkedCourseIds} title="Bookmarked courses" />}
            </>
          ) : (
            <StartHere catalog={catalog.data} bookmarked={bookmarkedCourseIds} title="Start here" intro />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <ComingUpSheet />
          <DueReviewsSheet due={model.dueByCourse} total={model.dueTotal} />
          {model.weakTopics.length > 0 && <WeakTopicsSheet topics={model.weakTopics} />}
          <WeekSheet week={model.week} streak={model.streak.current} longest={model.streak.longest} />
        </div>
      </div>
    </div>
  );
}

function GoalStrip({ model }: { model: TodayModel }) {
  const { goal } = model;
  const filled = Math.round(goal.ratio * 10);
  const states: BubbleState[] = Array.from({ length: 10 }, (_, index) => (index < filled ? (goal.ratio >= 1 && index === 9 ? 'correct' : 'filled') : 'empty'));
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end" aria-label="Daily goal">
      <BubbleStrip states={states} size="md" label={`Daily goal ${Math.round(goal.ratio * 100)}% complete`} />
      <p className="tabular text-sm text-ink-muted">
        {goal.ratio >= 1 ? <span className="font-medium text-correct">Goal met · </span> : null}
        {goal.minutes} / {goal.minutesGoal} min · {goal.questions} / {goal.questionsGoal} questions
      </p>
    </div>
  );
}

function lessonStates(questionIds: string[], progress: LessonProgressRecord | undefined): BubbleState[] {
  const answered = new Set(progress?.answeredQuestionIds ?? []);
  const correct = new Set(progress?.correctQuestionIds ?? []);
  return questionIds.map((id) => (correct.has(id) ? 'correct' : answered.has(id) ? 'wrong' : 'empty'));
}

function ResumeSheet({ resume }: { resume: ResumeTarget }) {
  const course = useCourse(resume.course.id);
  const location = course.data ? findLesson(course.data, resume.lessonId) : undefined;
  const questionIds = location?.lesson.questions.map((question) => question.id) ?? [];
  const states = lessonStates(questionIds, resume.progress);
  const firstOpen = states.findIndex((state) => state === 'empty');

  return (
    <Sheet title="Resume" aside={<Link to={courseUrl(resume.course.id)} className="hover:text-ink">{resume.course.title}</Link>}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[1.375rem] leading-snug font-semibold text-ink">{resume.lessonTitle}</p>
          {location?.lesson.subtitle && <p className="mt-0.5 text-ink-muted">{location.lesson.subtitle}</p>}
        </div>
        {questionIds.length > 0 && (
          <div className="flex flex-col gap-2">
            <BubbleStrip
              states={states.slice(0, STRIP_LIMIT)}
              selectedIndex={firstOpen >= 0 && firstOpen < STRIP_LIMIT ? firstOpen : undefined}
              label="Answer strip for this lesson"
            />
            <p className="tabular text-sm text-ink-muted">
              {resume.answered} of {questionIds.length} answered · {resume.correct} correct
              {questionIds.length > STRIP_LIMIT && ` · showing the first ${STRIP_LIMIT}`}
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={lessonUrl(resume.course.id, resume.lessonId)} variant="primary" size="lg" icon={<Play className="size-4" />}>
            {resume.answered > 0 ? 'Resume lesson' : 'Start lesson'}
          </ButtonLink>
        </div>
      </div>
    </Sheet>
  );
}

/** Good first courses in each extra, offered when the learner sees them. */
const STARTING_POINTS = ['hsk-1', 'jlpt-n5', 'shin500-n4n5', 'ai-01-python', 'it-sql'];
const START_COUNT = 5;

/** The bookmarked courses, else their own level's courses (their year first), then the starting points they see. */
function startingCourses(catalog: VisibleCatalog, bookmarked: string[]): CourseSummary[] {
  const byId = (ids: string[]) => ids.map((id) => catalog.courses.find((course) => course.id === id)).filter((course): course is CourseSummary => Boolean(course));
  const bookmarkedCourses = byId(bookmarked);
  if (bookmarkedCourses.length) return bookmarkedCourses;
  const level = learnerYearFirst(catalog.courses.filter((course) => course.category === catalog.visibility.profile?.level), catalog.visibility.profile);
  return [...level, ...byId(STARTING_POINTS)].slice(0, START_COUNT);
}

function StartHere({ catalog, bookmarked, title, intro = false }: { catalog: VisibleCatalog; bookmarked: string[]; title: string; intro?: boolean }) {
  const starts = startingCourses(catalog, bookmarked);
  return (
    <Sheet title={title} aside={<Link to="/settings#study-plans" className="hover:text-ink">Study plans</Link>}>
      {intro && (
        <p className="mb-4 max-w-[60ch] text-ink-muted">
          Pick a first lesson. Every answer you give is marked and saved; bookmark a course to keep it here, and give a subject a study plan to bring its weak topics and reviews here.
        </p>
      )}
      <ol className="divide-y divide-rule">
        {starts.map((course, index) => (
          <li key={course.id} className="flex items-center gap-3 py-2.5">
            <span className="display-numerals w-5 text-right text-print">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{course.title}</p>
              <p className="truncate text-sm text-ink-muted">{course.subtitle}</p>
            </div>
            {course.lessons[0] && (
              <ButtonLink to={lessonUrl(course.id, course.lessons[0].id)} size="sm" icon={<ArrowRight className="size-3.5" />}>
                Begin
              </ButtonLink>
            )}
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

function WeakTopicsSheet({ topics }: { topics: WeakTopic[] }) {
  return (
    <Sheet title="Weakest topics" aside={<Link to="/practice/weak" className="hover:text-ink">Practise all</Link>}>
      <ul className="flex flex-col">
        {topics.map((topic) => (
          <li key={topic.topicId} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
            <Bubble state={topic.level === 'weak' ? 'weak' : 'learning'} title={topic.level} />
            <div className="min-w-0 flex-1">
              <p className="truncate">{topic.title}</p>
              <p className="truncate text-xs text-ink-faint">{[SKILL_LABELS[topic.skill], topic.course?.title].filter(Boolean).join(' · ')}</p>
            </div>
            <span className="tabular text-sm text-ink-muted">{Math.round(topic.score * 100)}%</span>
            <ButtonLink to={`/practice/weak?topic=${encodeURIComponent(topic.topicId)}`} size="sm" variant="ghost">
              Practise
            </ButtonLink>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function WeekSheet({ week, streak, longest }: { week: WeekDay[]; streak: number; longest: number }) {
  return (
    <Sheet title="This week" aside={<Link to="/streak" className="hover:text-ink">Your streak</Link>}>
      <ol className="grid grid-cols-7 gap-1 text-center">
        {week.map((day) => {
          const date = parseDayKey(day.day);
          const active = day.minutes > 0 || day.attempts > 0;
          return (
            <li key={day.day} className="flex flex-col items-center gap-1">
              <span className={day.isToday ? 'text-xs font-medium text-print-strong' : 'text-xs text-ink-faint'}>
                {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
              <Bubble state={active ? 'filled' : day.isToday ? 'current' : 'empty'} size="lg" title={`${day.day}: ${day.minutes} min, ${day.attempts} answers`} />
              <span className="tabular text-xs text-ink-muted">{day.minutes ? `${day.minutes}m` : '–'}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-ink-muted">
        {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} in a row.` : 'Study today to start a streak.'}
        {longest > 0 && ` Longest: ${longest}.`}
      </p>
    </Sheet>
  );
}

