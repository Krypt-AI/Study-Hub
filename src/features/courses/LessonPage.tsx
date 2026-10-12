/**
 * The lesson: content blocks, then practice one question at a time on the lesson's answer
 * strip. Answers are recorded as they are marked.
 */
import { Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { SourceBadge } from '@/components/SourceBadge';
import { Bubble, BubbleStrip } from '@/components/ui/Bubble';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { learnerKeys, useLessonProgress } from '@/data/queries';
import type { LessonProgressRecord } from '@/data/records';
import { useRepository } from '@/data/useRepository';
import { contentLanguage } from '@/domain/content/language';
import { useCourse } from '@/domain/content/load';
import { adjacentLessons, findLesson } from '@/domain/content/navigation';
import type { Course, Lesson } from '@/domain/content/types';
import { courseUrl, lessonUrl } from '@/domain/content/urls';
import { completeLesson, reopenLesson } from '@/domain/learning/lessonProgress';
import { QuestionCard } from '@/features/practice/QuestionCard';
import { type SessionItem, usePracticeSession } from '@/features/practice/session/usePracticeSession';
import { LessonBlock } from './blocks/LessonBlocks';
import { CourseLoadError } from '@/features/auth/LockedContent';

export default function LessonPage() {
  const { courseId = '', lessonId = '' } = useParams();
  const course = useCourse(courseId);
  const progress = useLessonProgress(courseId);

  if (course.error) return <CourseLoadError title="This course could not be loaded" error={course.error} onRetry={() => void course.refetch()} />;
  if (!course.data || !progress.data) return <LoadingState />;
  const location = findLesson(course.data, lessonId);
  if (!location) return <ErrorState title="Lesson not found" error={`No lesson "${lessonId}" in ${course.data.title}.`} />;

  const record = progress.data.find((entry) => entry.lessonId === lessonId);
  // Remount per lesson so the practice session starts fresh.
  return <LessonView key={lessonId} course={course.data} lesson={location.lesson} unitTitle={location.unitTitle} progress={record} />;
}

function LessonView({ course, lesson, unitTitle, progress }: { course: Course; lesson: Lesson; unitTitle: string; progress?: LessonProgressRecord }) {
  const [searchParams] = useSearchParams();
  const repository = useRepository();
  const client = useQueryClient();
  const { previous, next } = adjacentLessons(course, lesson.id);

  const items = useMemo<SessionItem[]>(() => {
    const correct = new Set(progress?.correctQuestionIds ?? []);
    const answered = new Set(progress?.answeredQuestionIds ?? []);
    return lesson.questions.map((question) => ({
      question,
      courseId: course.id,
      lessonId: lesson.id,
      topics: question.topics.length ? question.topics : lesson.topics,
      previous: correct.has(question.id) ? 'correct' : answered.has(question.id) ? 'wrong' : undefined,
    }));
    // Session items are fixed when the lesson opens; progress updates must not reshuffle them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id, lesson]);

  const requested = searchParams.get('question');
  const initialIndex = Math.max(
    0,
    requested ? items.findIndex((item) => item.question.id === requested) : items.findIndex((item) => item.previous === undefined),
  );
  const session = usePracticeSession(items, 'lesson', initialIndex);

  const completion = useMutation({
    mutationFn: () =>
      progress?.status === 'completed'
        ? reopenLesson(repository, { courseId: course.id, lessonId: lesson.id })
        : completeLesson(repository, { courseId: course.id, lessonId: lesson.id }).then(() => undefined),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: learnerKeys.lessonProgress });
      void client.invalidateQueries({ queryKey: learnerKeys.activity });
    },
  });

  const completed = progress?.status === 'completed';

  return (
    <div className="mx-auto flex max-w-4xl min-w-0 flex-col gap-8 pb-10">
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
          <Link to="/courses" className="hover:text-ink">
            Courses
          </Link>
          <span aria-hidden>/</span>
          <Link to={courseUrl(course.id)} className="hover:text-ink">
            {course.title}
          </Link>
          <span aria-hidden>/</span>
          <span>{unitTitle}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[1.75rem] leading-tight font-semibold sm:text-[2rem]" lang={contentLanguage(course)}>
              {lesson.title}
            </h1>
            {lesson.subtitle && (
              <p className="mt-1 text-ink-muted" lang={contentLanguage(course)}>
                {lesson.subtitle}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <SourceBadge source={lesson.source} />
              {lesson.estimatedMinutes && <Tag>~{lesson.estimatedMinutes} min</Tag>}
              {completed && <Tag tone="correct">Completed</Tag>}
            </div>
          </div>
          <Button
            variant={completed ? 'secondary' : 'primary'}
            icon={completed ? <RotateCcw className="size-4" /> : <Check className="size-4" />}
            onClick={() => completion.mutate()}
            loading={completion.isPending}
          >
            {completed ? 'Study again' : 'Mark complete'}
          </Button>
        </div>
        {lesson.objectives.length > 0 && (
          <ul className="flex max-w-[70ch] flex-col gap-1 text-ink-muted">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex items-baseline gap-2.5">
                <Bubble state="empty" size="sm" />
                {objective}
              </li>
            ))}
          </ul>
        )}
      </header>

      {lesson.blocks.map((block, index) => (
        <LessonBlock key={index} block={block} sourceTitle={lesson.source.title} />
      ))}

      {items.length > 0 && (
        <Sheet
          title="Practice"
          aside={
            <span className="tabular">
              {session.summary.answered} answered · {session.summary.correct} correct
            </span>
          }
        >
          <div className="flex flex-col gap-5">
            <BubbleStrip
              states={session.stripStates}
              animateIndex={session.justMarked}
              selectedIndex={session.index}
              onSelect={session.goTo}
              label="Answer strip: choose a question"
            />
            <QuestionCard session={session} contentLang={contentLanguage(course)} />
          </div>
        </Sheet>
      )}

      <footer className="flex flex-wrap justify-between gap-3 border-t border-rule pt-5">
        {previous ? (
          <ButtonLink to={lessonUrl(course.id, previous.id)} icon={<ChevronLeft className="size-4" />}>
            {previous.title}
          </ButtonLink>
        ) : (
          <span />
        )}
        {next && (
          <ButtonLink to={lessonUrl(course.id, next.id)} variant={completed ? 'primary' : 'secondary'}>
            {next.title} <ChevronRight className="size-4" />
          </ButtonLink>
        )}
      </footer>
    </div>
  );
}
