/**
 * The modules of a foundation course that a certification or roadmap stage builds on, each with its
 * lessons as bubbles and a link to the first lesson still to do.
 */
import { Link } from 'react-router';
import { BubbleStrip } from '@/components/ui/Bubble';
import { foundationModules } from '@/domain/content/foundations';
import type { CourseSummary, StageFoundation } from '@/domain/content/types';
import { courseUrl, lessonUrl } from '@/domain/content/urls';
import type { LessonStatuses } from '@/features/courses/useLessonStatuses';

export function FoundationModules({ course, foundation, statuses }: { course: CourseSummary; foundation: Pick<StageFoundation, 'unitIds'>; statuses?: LessonStatuses }) {
  const modules = foundationModules(course, foundation);
  if (foundation.unitIds.length === 0) {
    return (
      <Link to={courseUrl(course.id)} className="text-sm text-print-strong hover:underline">
        The whole of {course.title}
      </Link>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {modules.map((module) => {
        const next = module.lessons.find((lesson) => statuses?.get(lesson.id) !== 'completed') ?? module.lessons[0];
        return (
          <li key={module.id}>
            <Link to={next ? lessonUrl(course.id, next.id) : courseUrl(course.id)} className="group flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm text-print-strong group-hover:underline">{module.title}</span>
              <BubbleStrip
                states={module.lessons.map((lesson) => (statuses?.get(lesson.id) === 'completed' ? 'filled' : statuses?.has(lesson.id) ? 'learning' : 'empty'))}
                label={`${module.title} lessons`}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
