/** "Show on Today" for one subject: when on, its due reviews and weak topics come to Today. */
import { Switch } from '@/components/ui/Switch';
import { useSetOnToday, useSettings } from '@/data/queries';

/** With `listLabel`, only the switch shows, named by it (for a list of subjects). */
export function ShowOnTodaySwitch({ courseId, listLabel, className }: { courseId: string; listLabel?: string; className?: string }) {
  const settings = useSettings();
  const setOnToday = useSetOnToday();
  const on = settings.data?.todayCourseIds.includes(courseId) ?? false;
  return (
    <Switch
      className={className}
      label={listLabel ?? 'Show on Today'}
      description={listLabel ? undefined : 'Its reviews and weak topics appear on Today. Subjects that are off wait quietly until you open them.'}
      hideLabel={Boolean(listLabel)}
      checked={on}
      disabled={!settings.data || setOnToday.isPending}
      onChange={(next) => setOnToday.mutate({ courseId, on: next })}
    />
  );
}
