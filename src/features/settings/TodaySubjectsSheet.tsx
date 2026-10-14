/** Settings: which subjects show on Today, among those the learner has started or already chose. */
import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import { useLessonProgress, useSettings } from '@/data/queries';
import { courseUrl } from '@/domain/content/urls';
import { ShowOnTodaySwitch } from '@/features/courses/ShowOnTodaySwitch';
import { useVisibleCatalog } from '@/features/profile/useVisibility';

export function TodaySubjectsSheet() {
  const catalog = useVisibleCatalog();
  const settings = useSettings();
  const progress = useLessonProgress();
  const listed = new Set([...(settings.data?.todayCourseIds ?? []), ...(progress.data ?? []).map((record) => record.courseId)]);
  // A subject switched off stays in the list until the page is left, so it can be switched back on.
  const [shown, setShown] = useState<string[]>([]);
  const added = [...listed].filter((id) => !shown.includes(id));
  if (added.length > 0) setShown([...shown, ...added]);
  const courses = (catalog.data?.courses ?? []).filter((course) => shown.includes(course.id) || listed.has(course.id));

  return (
    <Sheet id="subjects-on-today" title="Subjects on Today">
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-muted">
          Choose the subjects you are taking now. Only they bring reviews and weak topics to Today; with none chosen, every subject counts. You can also switch this on each course page.
        </p>
        {courses.length === 0 ? (
          <EmptyState title="No subjects started yet">
            Open a course from <Link to="/courses" className="text-print-strong hover:underline">Courses</Link> to begin.
          </EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-rule">
            {courses.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-4 py-2.5">
                <Link to={courseUrl(course.id)} className="min-w-0 truncate font-medium text-ink hover:text-print-strong">
                  {course.title}
                </Link>
                <ShowOnTodaySwitch courseId={course.id} listLabel={`Show ${course.title} on Today`} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
