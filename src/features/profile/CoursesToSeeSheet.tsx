/** Settings › Courses I want to see: the extras in the learner's lists, changed at once. Guests have none. */
import { Sheet } from '@/components/ui/Sheet';
import { useSettings, useUpdateSettings } from '@/data/queries';
import { canOpenLockedContent, useAuth } from '@/features/auth/useAuth';
import { ExtrasChoice } from './ExtrasChoice';

export const COURSES_TO_SEE_ID = 'courses-i-want-to-see';

export function CoursesToSeeSheet() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const auth = useAuth();
  if (!settings.data || !canOpenLockedContent(auth)) return null;
  return (
    <Sheet id={COURSES_TO_SEE_ID} title="Courses I want to see">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">Your own level is always shown. Turning a choice off only hides it: your progress in it is kept.</p>
        <ExtrasChoice value={settings.data.visibleCategories} onChange={(next) => update.mutate((current) => ({ ...current, visibleCategories: next, extrasChosen: true }))} />
      </div>
    </Sheet>
  );
}
