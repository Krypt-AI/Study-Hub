/** Settings: each subject's study plan, among those the learner has started or already planned. */
import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import { useLessonProgress, useSettings } from '@/data/queries';
import { courseUrl } from '@/domain/content/urls';
import { plannedCourseIds } from '@/domain/learning/studyPlan';
import { StudyPlanSelect } from '@/features/courses/StudyPlanPicker';
import { useVisibleCatalog } from '@/features/profile/useVisibility';

export function StudyPlansSheet() {
  const catalog = useVisibleCatalog();
  const settings = useSettings();
  const progress = useLessonProgress();
  const listed = new Set([...plannedCourseIds(settings.data?.studyPlans ?? {}), ...(progress.data ?? []).map((record) => record.courseId)]);
  // A subject set back to "Use the material" stays in the list until the page is left, so it can be changed again.
  const [shown, setShown] = useState<string[]>([]);
  const added = [...listed].filter((id) => !shown.includes(id));
  if (added.length > 0) setShown([...shown, ...added]);
  const courses = (catalog.data?.courses ?? []).filter((course) => shown.includes(course.id) || listed.has(course.id));

  return (
    <Sheet id="study-plans" title="Study plans">
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-muted">
          Choose what Study Hub does with each subject: just use its material, also practise its weak topics, or also review answered questions when they are due. Only subjects you practise or review appear on
          the Dashboard. You can also choose on each course page.
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
                <StudyPlanSelect courseId={course.id} label={`Study plan for ${course.title}`} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
