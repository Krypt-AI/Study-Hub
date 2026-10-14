/** Star a course you are taking now: Today and due reviews then show only starred courses. */
import { Star } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { useSettings, useToggleStar } from '@/data/queries';
import { cn } from '@/lib/cn';

export function StarButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const settings = useSettings();
  const toggle = useToggleStar();
  const starred = settings.data?.starredCourseIds.includes(courseId) ?? false;
  return (
    <IconButton
      label={`Star ${courseTitle}`}
      title={starred ? 'Starred: shown on Today. Click to unstar.' : 'Star this course to show it on Today'}
      aria-pressed={starred}
      disabled={!settings.data || toggle.isPending}
      onClick={() => toggle.mutate(courseId)}
    >
      <Star className={cn('size-4', starred ? 'fill-current text-print' : 'text-ink-muted')} />
    </IconButton>
  );
}
