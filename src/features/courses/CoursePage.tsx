/**
 * A course: what it covers, where the material comes from, its modules and their lessons with progress,
 * mastery per topic and skill, mock exams, the certifications it prepares for and those it is a
 * foundation for.
 */
import { Award, Bookmark, BookmarkCheck, ClipboardCheck, Play } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { SourceBadge } from '@/components/SourceBadge';
import { Bubble } from '@/components/ui/Bubble';
import { ButtonLink, IconButton } from '@/components/ui/Button';
import { LoadingState, Tag } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useLessonProgress, useTopicMastery } from '@/data/queries';
import type { TopicMasteryRecord } from '@/data/records';
import { contentLanguage } from '@/domain/content/language';
import { useCatalog, useCourse } from '@/domain/content/load';
import { lessonsInOrder } from '@/domain/content/navigation';
import type { Assessment, Course, Lesson } from '@/domain/content/types';
import { assessmentUrl, certificationUrl, courseUrl, lessonUrl } from '@/domain/content/urls';
import { masteryKey, masteryLevel, SKILL_LABELS, SKILLS } from '@/domain/learning/mastery';
import { useBookmark } from '@/features/practice/useBookmark';
import { CourseLoadError } from '@/features/auth/LockedContent';
import { CourseVisibilityNotes } from '@/features/profile/CourseVisibilityNotes';
import { CourseAbout } from './CourseAbout';
import { CourseModules } from './CourseModules';
import { StudyPlanPicker } from './StudyPlanPicker';
import { groupAssessments, type PastPaperGroup } from '@/domain/content/pastPapers';
import { certificationsBuiltOn } from '@/domain/content/foundations';
import { RELEVANCE } from '@/features/certifications/certificationLabels';
import { paperWords } from '@/features/practice/paperWords';

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
  const builtOn = certificationsBuiltOn(catalog.data?.certifications ?? [], data.id).filter(({ certification }) => !certifications.includes(certification));
  const prerequisites = (catalog.data?.courses ?? []).filter((candidate) => data.prerequisites.includes(candidate.id));
  const { pastPapers, practice } = groupAssessments(data.assessments);
  // A subject with past papers and no lessons yet: the papers are what there is to do.
  const papersFirst = data.units.length === 0;
  const paperNotes = data.units.filter((unit) => unit.pastPapers).flatMap((unit) => unit.lessons);

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
          {lessons.length > 0 && (
            <Tag tone={completed === lessons.length ? 'correct' : 'neutral'}>
              {completed} / {lessons.length} lessons
            </Tag>
          )}
        </div>
        <StudyPlanPicker courseId={data.id} className="mt-4 max-w-3xl" />
        <div className="mt-4 flex flex-col items-start gap-3 empty:hidden">
          <CourseVisibilityNotes course={data} />
        </div>
      </PageHeader>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <CourseAbout description={data.description} notice={data.contentNotice} />
          {papersFirst && <PastPapersSheet course={data} groups={pastPapers} notes={paperNotes} />}
          <CourseModules course={data} lessonOrder={lessons.map(({ lesson }) => lesson.id)} records={records} nextLessonId={nextLesson?.id} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {!papersFirst && <PastPapersSheet course={data} groups={pastPapers} notes={paperNotes} />}
          {practice.length > 0 && (
            <Sheet title="Mock exams and quizzes">
              <ul className="flex flex-col gap-3">
                {practice.map((assessment) => (
                  <AssessmentItem key={assessment.id} course={data} assessment={assessment} action={assessment.kind === 'mock-exam' ? 'Take the mock exam' : 'Take the quiz'} />
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
          {builtOn.length > 0 && (
            <Sheet title="A foundation for">
              <ul className="flex flex-col gap-2">
                {builtOn.map(({ certification, foundation }) => (
                  <li key={certification.id} className="flex items-center gap-2">
                    <Award className="size-4 shrink-0 text-ink-faint" aria-hidden />
                    <Link to={certificationUrl(certification.id)} className="min-w-0 flex-1 truncate hover:text-print-strong">
                      {certification.name}
                    </Link>
                    <Tag tone={RELEVANCE[foundation.relevance].tone} title={RELEVANCE[foundation.relevance].description}>
                      {RELEVANCE[foundation.relevance].label}
                    </Tag>
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
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-ink-muted">
              <th className="pb-2 text-left font-display font-semibold">Topic</th>
              {SKILLS.map((skill) => (
                <th key={skill} className="w-[4.25rem] px-0 pb-2 text-center font-display text-xs font-semibold">
                  {SKILL_LABELS[skill]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ topic, cells }) => (
              <tr key={topic.id} className="border-t border-rule">
                <td className="truncate py-1.5 pr-2" title={topic.title}>
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

function PastPapersSheet({ course, groups, notes }: { course: Course; groups: PastPaperGroup[]; notes: Lesson[] }) {
  if (groups.length === 0 && notes.length === 0) return null;
  return (
    <Sheet title="Past papers">
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group.kind} aria-label={group.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{group.title}</h3>
            <ul className="flex flex-col gap-3">
              {group.papers.map((assessment) => (
                <AssessmentItem key={assessment.id} course={course} assessment={assessment} action="Try this paper" />
              ))}
            </ul>
          </section>
        ))}
        {notes.length > 0 && (
          <section aria-label="Notes on the papers" className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">Notes on the papers</h3>
            <ul className="flex flex-col gap-1.5">
              {notes.map((lesson) => (
                <li key={lesson.id}>
                  <Link to={lessonUrl(course.id, lesson.id)} className="text-print-strong hover:underline">
                    {lesson.title}
                  </Link>
                  {lesson.subtitle && <p className="text-sm text-ink-muted">{lesson.subtitle}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Sheet>
  );
}

/** "3 sections, 60 marks, 90 minutes": a marked paper gives its marks, others their question count. */
function paperDetails(course: Course, assessment: Assessment): string {
  const words = paperWords(contentLanguage(course));
  const questions = assessment.sections.flatMap((section) => section.questions);
  const marked = questions.some((question) => question.marks !== undefined);
  // A "choose" section counts its chosen questions' marks once, as the paper prints its total.
  const marks = assessment.sections.reduce((sum, section) => {
    const each = section.questions.map((question) => question.marks ?? 1).sort((a, b) => b - a);
    return sum + each.slice(0, section.choose ?? each.length).reduce((total, value) => total + value, 0);
  }, 0);
  return [
    words.sections(assessment.sections.length),
    marked ? words.marks(marks) : words.questions(questions.length),
    assessment.timeLimitMinutes ? words.minutes(assessment.timeLimitMinutes) : undefined,
  ]
    .filter(Boolean)
    .join(', ');
}

function AssessmentItem({ course, assessment, action }: { course: Course; assessment: Assessment; action: string }) {
  return (
    <li className="flex flex-col gap-2">
      <p className="font-medium" lang={contentLanguage(course)}>
        {assessment.title}
      </p>
      <p className="text-sm text-ink-muted">{paperDetails(course, assessment)}</p>
      <ButtonLink to={assessmentUrl(course.id, assessment.id)} icon={<ClipboardCheck className="size-4" />} className="self-start">
        {action}
      </ButtonLink>
    </li>
  );
}
