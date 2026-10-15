/**
 * The playground is listed in the rail only for learners it helps: those who have started (or planned
 * to practise) a course with code or SQL exercises, or who already keep projects there. The route itself
 * always works, so links to exercises still open it.
 */
import { useCodeProjects, useLessonProgress, useSettings } from '@/data/queries';
import { useCatalog } from '@/domain/content/load';
import { plannedCourseIds } from '@/domain/learning/studyPlan';

export function usePlaygroundInRail(): boolean {
  const catalog = useCatalog();
  const progress = useLessonProgress();
  const settings = useSettings();
  const projects = useCodeProjects();
  if ((projects.data?.length ?? 0) > 0) return true;
  const codeCourses = new Set((catalog.data?.courses ?? []).filter((course) => course.hasCode).map((course) => course.id));
  const learning = [...(progress.data ?? []).map((record) => record.courseId), ...plannedCourseIds(settings.data?.studyPlans ?? {})];
  return learning.some((courseId) => codeCourses.has(courseId));
}
