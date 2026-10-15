/** Roadmaps: the learning paths on offer, each a column of stages with its courses and certifications. */
import { AreaIndex, type AreaEntry } from '@/components/ui/AreaIndex';
import { ErrorState, LoadingState } from '@/components/ui/Feedback';
import { PageHeader } from '@/components/ui/Sheet';
import { useVisibleCatalog } from '@/features/profile/useVisibility';
import { useLessonStatuses } from '@/features/courses/useLessonStatuses';

export default function RoadmapsPage() {
  const catalog = useVisibleCatalog();
  const statuses = useLessonStatuses();
  if (catalog.error) return <ErrorState title="Roadmap content is not built yet" error={catalog.error} onRetry={() => void catalog.refetch()} />;
  if (!catalog.data) return <LoadingState />;

  const courseIds = new Set(catalog.data.courses.map((course) => course.id));
  const entries: AreaEntry[] = catalog.data.roadmaps.map((roadmap) => {
    const planned = roadmap.stages.flatMap((stage) => stage.courseIds);
    const started = planned.filter((id) => courseIds.has(id) && statuses.has(id)).length;
    return {
      id: roadmap.id,
      title: roadmap.title.replace(/ Roadmap$/u, ''),
      description: roadmap.description.split('. ')[0]?.replace(/\.$/u, '') + '.',
      count: `${roadmap.stages.length} stages`,
      note: started ? `${started} started` : undefined,
      to: `/roadmaps/${roadmap.id}`,
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Roadmaps" lead="Choose a path and follow it stage by stage." />
      <AreaIndex label="Roadmaps" entries={entries} />
    </div>
  );
}
