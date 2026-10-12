/**
 * A learning roadmap: stages down one column of bubbles, each filled as its courses are
 * completed, with the courses to take and the certifications the stage prepares for.
 */
import { Link, useParams } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { Bubble, type BubbleState, BubbleStrip } from '@/components/ui/Bubble';
import { ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/Sheet';
import { useCertificationProgress, useLessonProgress } from '@/data/queries';
import { useCatalog } from '@/domain/content/load';
import type { Catalog, Roadmap } from '@/domain/content/types';
import { certificationUrl, courseUrl } from '@/domain/content/urls';
import { cn } from '@/lib/cn';
import { PROVIDER_STATUS, TRACKING } from './certificationLabels';

export default function RoadmapPage() {
  const { roadmapId = '' } = useParams();
  const catalog = useCatalog();
  const progress = useLessonProgress();
  const tracking = useCertificationProgress();

  if (catalog.error) return <ErrorState title="Roadmap content is not built yet" error={catalog.error} />;
  if (!catalog.data || !progress.data || !tracking.data) return <LoadingState />;
  const roadmap = catalog.data.roadmaps.find((candidate) => candidate.id === roadmapId);
  if (!roadmap) return <ErrorState title="Roadmap not found" error={`No roadmap "${roadmapId}".`} />;

  const completed = new Set(progress.data.filter((record) => record.status === 'completed').map((record) => record.lessonId));
  const started = new Set(progress.data.map((record) => record.lessonId));
  return <RoadmapView roadmap={roadmap} catalog={catalog.data} completed={completed} started={started} tracking={new Map(tracking.data.map((record) => [record.certId, record.status]))} />;
}

interface RoadmapViewProps {
  roadmap: Roadmap;
  catalog: Catalog;
  completed: Set<string>;
  started: Set<string>;
  tracking: Map<string, keyof typeof TRACKING>;
}

function RoadmapView({ roadmap, catalog, completed, started, tracking }: RoadmapViewProps) {
  const courseById = new Map(catalog.courses.map((course) => [course.id, course]));
  const certificationById = new Map(catalog.certifications.map((certification) => [certification.id, certification]));

  const stages = roadmap.stages.map((stage) => {
    const courses = stage.courseIds.flatMap((id) => {
      const course = courseById.get(id);
      return course ? [course] : [];
    });
    const lessons = courses.flatMap((course) => course.lessons);
    const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
    const state: BubbleState =
      courses.length === 0 ? 'new' : lessons.length > 0 && done === lessons.length ? 'mastered' : lessons.some((lesson) => started.has(lesson.id)) ? 'learning' : 'empty';
    return { stage, courses, planned: stage.courseIds.length - courses.length, done, total: lessons.length, state };
  });
  const finished = stages.filter((entry) => entry.state === 'mastered').length;

  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
        <Link to="/certifications" className="hover:text-ink">
          Certifications
        </Link>
      </nav>
      <PageHeader title={roadmap.title} lead={`${finished} of ${stages.length} stages complete`}>
        <BubbleStrip states={stages.map((entry) => entry.state)} size="md" numbered className="mt-3" label="Stages" />
      </PageHeader>
      <Markdown className="mb-8 max-w-[70ch]">{roadmap.description}</Markdown>

      <ol className="relative flex flex-col">
        {stages.map(({ stage, courses, planned, done, total, state }, index) => (
          <li key={stage.id} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0">
            {index < stages.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-[1.25rem] w-px bg-print-line" />}
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <span className="display-numerals text-sm text-print">{String(index + 1).padStart(2, '0')}</span>
              <Bubble state={state} size="lg" title={state === 'new' ? 'Course in preparation' : state === 'mastered' ? 'Complete' : state === 'learning' ? 'In progress' : 'Not started'} />
            </div>
            <section aria-labelledby={`${stage.id}-title`} className="flex min-w-0 flex-col gap-2">
              <h2 id={`${stage.id}-title`} className="text-xl font-semibold">
                {stage.title}
              </h2>
              <p className="max-w-[70ch] text-ink-muted">{stage.summary}</p>
              <div className="flex flex-col gap-1.5">
                {courses.map((course) => (
                  <Link key={course.id} to={courseUrl(course.id)} className="group flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium text-print-strong group-hover:underline">{course.title}</span>
                    {course.lessons.length <= 30 && (
                      <BubbleStrip states={course.lessons.map((lesson) => (completed.has(lesson.id) ? 'filled' : started.has(lesson.id) ? 'learning' : 'empty'))} label={`${course.title} lessons`} />
                    )}
                  </Link>
                ))}
                {total > 0 && (
                  <span className="tabular text-xs text-ink-faint">
                    {done} / {total} lessons complete
                  </span>
                )}
                {planned > 0 && (
                  <span className={cn('text-sm text-ink-faint', courses.length === 0 && 'italic')}>
                    {courses.length === 0 ? 'The course for this stage is in preparation.' : `${planned} more course${planned === 1 ? ' is' : 's are'} in preparation.`}
                  </span>
                )}
              </div>
              {stage.certificationIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-ink-faint">Prepares for</span>
                  {stage.certificationIds.flatMap((id) => {
                    const certification = certificationById.get(id);
                    if (!certification) return [];
                    const status = certification.status === 'active' ? undefined : PROVIDER_STATUS[certification.status];
                    const plan = tracking.get(id);
                    return [
                      <Link key={id} to={certificationUrl(id)} className="inline-flex">
                        <Tag tone={plan === 'passed' ? 'correct' : status?.tone === 'wrong' ? 'wrong' : 'print'} title={plan ? TRACKING[plan].label : status?.label}>
                          {certification.code ?? certification.name}
                          {status && ` · ${status.label}`}
                        </Tag>
                      </Link>,
                    ];
                  })}
                </div>
              )}
            </section>
          </li>
        ))}
      </ol>
    </div>
  );
}
