/**
 * The modules of a foundation course that a certification or roadmap stage builds on, as links to
 * those modules in the course's Modules list (where their lessons and progress are).
 */
import { Link } from 'react-router';
import { foundationModules } from '@/domain/content/foundations';
import type { CourseSummary, StageFoundation } from '@/domain/content/types';
import { courseUrl, moduleUrl } from '@/domain/content/urls';

export function FoundationModules({ course, foundation }: { course: CourseSummary; foundation: Pick<StageFoundation, 'unitIds'> }) {
  if (foundation.unitIds.length === 0) {
    return (
      <Link to={courseUrl(course.id)} className="text-sm text-print-strong hover:underline">
        The whole of {course.title}
      </Link>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {foundationModules(course, foundation).map((module) => (
        <li key={module.id}>
          <Link to={moduleUrl(course.id, module.id)} className="text-sm text-print-strong hover:underline">
            {module.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
