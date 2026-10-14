/** One course as a ruled row: its name, what it holds, and (once started) its lesson strip. Where it comes from is on the course page. */
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { BubbleStrip, type BubbleState } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import type { CourseSummary } from '@/domain/content/types';
import { courseUrl } from '@/domain/content/urls';
import type { LessonStatuses } from './useLessonStatuses';

/** "12 lessons, 2 past papers", or only "4 past papers" for a subject without lessons yet. */
function contentsLine(course: CourseSummary): string {
  const parts = course.lessonCount ? [`${course.lessonCount} lesson${course.lessonCount === 1 ? '' : 's'}`] : [];
  const papers = course.assessments.filter((assessment) => assessment.paper).length;
  const practice = course.assessments.length - papers;
  if (papers) parts.push(`${papers} past paper${papers === 1 ? '' : 's'}`);
  if (practice) parts.push(`${practice} mock exam${practice === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function CourseRow({ course, lessons }: { course: CourseSummary; lessons?: LessonStatuses }) {
  const started = Boolean(lessons?.size);
  const states: BubbleState[] = course.lessons.map((lesson) => {
    const status = lessons?.get(lesson.id);
    return status === 'completed' ? 'filled' : status === 'in-progress' ? 'learning' : 'empty';
  });
  const completed = states.filter((state) => state === 'filled').length;

  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0 flex-1">
        <Link to={courseUrl(course.id)} className="text-[1.0625rem] font-semibold text-ink hover:text-print-strong">
          {course.title}
        </Link>
        {course.subtitle && <p className="truncate text-sm text-ink-muted">{course.subtitle}</p>}
        <p className="tabular mt-1 text-sm text-ink-faint">{contentsLine(course)}</p>
      </div>
      {started && states.length <= 40 && (
        <div className="flex flex-col gap-1 sm:w-56">
          <BubbleStrip states={states} label={`${course.title}: ${completed} of ${states.length} lessons completed`} />
          <span className="tabular text-xs text-ink-faint">
            {completed} of {states.length} done
          </span>
        </div>
      )}
      <ButtonLink to={courseUrl(course.id)} size="sm" variant={started ? 'primary' : 'secondary'} icon={<ArrowRight className="size-3.5" />} className="self-start sm:self-center">
        {started ? 'Continue' : 'Open'}
      </ButtonLink>
    </li>
  );
}
