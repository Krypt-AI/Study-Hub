/**
 * A course: what it covers, where the material comes from, lessons by unit with progress,
 * mastery per topic and skill, mock exams and related certifications.
 */
import { Award, Bookmark, BookmarkCheck, ClipboardCheck, Play } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { SourceBadge } from '@/components/SourceBadge';
import { Bubble, type BubbleState } from '@/components/ui/Bubble';
import { ButtonLink, IconButton } from '@/components/ui/Button';
import { LoadingState, Tag } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useLessonProgress, useTopicMastery } from '@/data/queries';
import type { TopicMasteryRecord } from '@/data/records';
import { contentLanguage } from '@/domain/content/language';
import { useCatalog, useCourse } from '@/domain/content/load';
import { lessonsInOrder } from '@/domain/content/navigation';
import type { Assessment, Course } from '@/domain/content/types';
import { assessmentUrl, certificationUrl, courseUrl, lessonUrl } from '@/domain/content/urls';
import { masteryKey, masteryLevel, SKILL_LABELS, SKILLS } from '@/domain/learning/mastery';
import { useBookmark } from '@/features/practice/useBookmark';
import { CourseLoadError } from '@/features/auth/LockedContent';
import { ShowOnTodaySwitch } from './ShowOnTodaySwitch';
import { groupAssessments } from '@/domain/content/pastPapers';

export default function CoursePage() {
  const { courseId = '' } = useParams();
  const course = useCourse(courseId);
  const catalog = useCatalog();
  const progress = useLessonProgress(courseId);
  const mastery = useTopicMastery();
  const bookmark = useBookmark(course.data ? { type: 'course', id: course.data.id, label: course.data.title } : undefined);

  if (course.error) return <CourseLoadError title="This course could not be loaded" error={course.error} onRetry={() => void course.refetch()} />;
  if (!course.data || !progress.data) return <LoadingState />;
  const data = course.data;
  const records = new Map(progress.data.map((record) => [record.lessonId, record]));
  const lessons = lessonsInOrder(data);
  const nextLesson = lessons.find(({ lesson }) => records.get(lesson.id)?.status !== 'completed')?.lesson ?? lessons[0]?.lesson;
  const completed = lessons.filter(({ lesson }) => records.get(lesson.id)?.status === 'completed').length;
  const certifications = (catalog.data?.certifications ?? []).filter((certification) => data.certifications.includes(certification.id) || certification.relatedCourses.includes(data.id));
  const prerequisites = (catalog.data?.courses ?? []).filter((candidate) => data.prerequisites.includes(candidate.id));
  const { pastPapers, practice } = groupAssessments(data.assessments);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={data.title}
        lead={data.subtitle}
        actions={
          <>
            <IconButton label={bookmark.isBookmarked ? 'Remove bookmark' : 'Bookmark course'} onClick={bookmark.toggle} aria-pressed={bookmark.isBookmarked}>
              {bookmark.isBookmarked ? <BookmarkCheck className="size-4 text-print" /> : <Bookmark className="size-4" />}
            </IconButton>
            {nextLesson && (
              <ButtonLink to={lessonUrl(data.id, nextLesson.id)} variant="primary" size="lg" icon={<Play className="size-4" />}>
                {completed === 0 ? 'Start course' : completed === lessons.length ? 'Review course' : 'Continue'}
              </ButtonLink>
            )}
          </>
        }
      >
        <div className="mt-2 flex flex-wrap gap-1.5">
          <SourceBadge source={data.source} />
          {data.level && <Tag>{data.level}</Tag>}
          <Tag>{data.difficulty}</Tag>
          {data.estimatedHours && <Tag>~{data.estimatedHours} h</Tag>}
          <Tag tone={completed === lessons.length && lessons.length > 0 ? 'correct' : 'neutral'}>
            {completed} / {lessons.length} lessons
          </Tag>
        </div>
        <ShowOnTodaySwitch courseId={data.id} className="mt-4 max-w-lg" />
      </PageHeader>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Markdown className="max-w-[70ch]">{data.description}</Markdown>
          {data.contentNotice && (
            <aside className="rounded-md bg-print-soft px-4 py-3 text-sm">
              <Markdown compact>{data.contentNotice}</Markdown>
            </aside>
          )}
          {data.units.map((unit) => (
            <Sheet key={unit.id} title={unit.title} aside={<span className="tabular">{unit.lessons.length} lesson{unit.lessons.length === 1 ? '' : 's'}</span>} padded={false}>
              <ol className="divide-y divide-rule">
                {unit.lessons.map((lesson) => {
                  const record = records.get(lesson.id);
                  const state: BubbleState = record?.status === 'completed' ? 'filled' : record ? 'learning' : 'empty';
                  const answered = record?.answeredQuestionIds.length ?? 0;
                  const index = lessons.findIndex((entry) => entry.lesson.id === lesson.id) + 1;
                  return (
                    <li key={lesson.id}>
                      <Link to={lessonUrl(data.id, lesson.id)} className="grid grid-cols-[1.75rem_1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-sheet-2">
                        <span className="display-numerals text-right text-print">{index}</span>
                        <Bubble state={state} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium" lang={contentLanguage(data)}>
                            {lesson.title}
                          </span>
                          {lesson.subtitle && <span className="block truncate text-sm text-ink-muted">{lesson.subtitle}</span>}
                        </span>
                        <span className="tabular text-right text-xs text-ink-faint">
                          {lesson.questions.length > 0 ? `${answered}/${lesson.questions.length}` : ''}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </Sheet>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {pastPapers.length > 0 && (
            <Sheet title="Past papers">
              <div className="flex flex-col gap-5">
                {pastPapers.map((group) => (
                  <section key={group.kind} aria-label={group.title} className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{group.title}</h3>
                    <ul className="flex flex-col gap-3">
                      {group.papers.map((assessment) => (
                        <AssessmentItem key={assessment.id} courseId={data.id} assessment={assessment} action="Try this paper" />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </Sheet>
          )}
          {practice.length > 0 && (
            <Sheet title="Mock exams and quizzes">
              <ul className="flex flex-col gap-3">
                {practice.map((assessment) => (
                  <AssessmentItem key={assessment.id} courseId={data.id} assessment={assessment} action={assessment.kind === 'mock-exam' ? 'Take the mock exam' : 'Take the quiz'} />
                ))}
              </ul>
            </Sheet>
          )}
          <MasterySheet course={data} mastery={mastery.data ?? []} />
          {prerequisites.length > 0 && (
            <Sheet title="Before this course">
              <ul className="flex flex-col gap-1.5">
                {prerequisites.map((prerequisite) => (
                  <li key={prerequisite.id}>
                    <Link to={courseUrl(prerequisite.id)} className="text-print-strong hover:underline">
                      {prerequisite.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Sheet>
          )}
          {certifications.length > 0 && (
            <Sheet title="Prepares you for">
              <ul className="flex flex-col gap-2">
                {certifications.map((certification) => (
                  <li key={certification.id} className="flex items-center gap-2">
                    <Award className="size-4 shrink-0 text-print" aria-hidden />
                    <Link to={certificationUrl(certification.id)} className="min-w-0 truncate hover:text-print-strong">
                      {certification.name}
                    </Link>
                    {certification.status !== 'active' && <Tag tone={certification.status === 'retired' ? 'wrong' : 'slip'}>{certification.status}</Tag>}
                  </li>
                ))}
              </ul>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  );
}

function MasterySheet({ course, mastery }: { course: Course; mastery: TopicMasteryRecord[] }) {
  const rows = useMemo(() => {
    const byKey = new Map(mastery.map((record) => [record.key, record]));
    return course.topics
      .map((topic) => ({ topic, cells: SKILLS.map((skill) => ({ skill, record: byKey.get(masteryKey(topic.id, skill)) })) }))
      .filter((row) => row.cells.some((cell) => cell.record));
  }, [course.topics, mastery]);

  return (
    <Sheet title="Mastery by topic">
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">As you answer questions, each topic shows how well you can recognise, recall, explain and apply it.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-muted">
              <th className="pb-2 text-left font-display font-semibold">Topic</th>
              {SKILLS.map((skill) => (
                <th key={skill} className="px-1 pb-2 text-center font-display text-xs font-semibold">
                  {SKILL_LABELS[skill]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ topic, cells }) => (
              <tr key={topic.id} className="border-t border-rule">
                <td className="max-w-40 truncate py-1.5 pr-2" title={topic.title}>
                  {topic.title}
                </td>
                {cells.map(({ skill, record }) => {
                  const level = masteryLevel(record);
                  return (
                    <td key={skill} className="py-1.5 text-center">
                      <Bubble
                        state={level}
                        size="sm"
                        title={record ? `${SKILL_LABELS[skill]}: ${level}, ${Math.round(record.ema * 100)}% over ${record.attempts} answers` : `${SKILL_LABELS[skill]}: not practised yet`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Sheet>
  );
}

function AssessmentItem({ courseId, assessment, action }: { courseId: string; assessment: Assessment; action: string }) {
  const questions = assessment.sections.reduce((sum, section) => sum + section.questions.length, 0);
  return (
    <li className="flex flex-col gap-2">
      <p className="font-medium">{assessment.title}</p>
      <p className="text-sm text-ink-muted">
        {assessment.sections.length} section{assessment.sections.length === 1 ? '' : 's'} · {questions} questions
        {assessment.timeLimitMinutes ? ` · ${assessment.timeLimitMinutes} min` : ''}
      </p>
      <ButtonLink to={assessmentUrl(courseId, assessment.id)} icon={<ClipboardCheck className="size-4" />} className="self-start">
        {action}
      </ButtonLink>
    </li>
  );
}
