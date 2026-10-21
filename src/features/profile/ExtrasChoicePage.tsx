/**
 * "What do you want to study?": asked once of a learner who can choose extras (signed in, or local
 * mode), after the Welcome page. Their own level is always on; the extras start unticked, except
 * where they already have progress or saved questions. Skipping keeps the extras as they are.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Feedback';
import { useBookmarks, useLessonProgress, useSaveSettings } from '@/data/queries';
import type { Settings } from '@/data/records';
import { useCatalog } from '@/domain/content/load';
import { type ExtraCategory, extrasOf } from '@/domain/content/visibility';
import { SCHOOL_LEVEL_LABELS, yearLabel } from '@/domain/profile/profile';
import { ExtrasChoice } from './ExtrasChoice';

export function ExtrasChoicePage({ settings }: { settings: Settings }) {
  const catalog = useCatalog();
  const progress = useLessonProgress();
  const bookmarks = useBookmarks();
  if (!catalog.data || !progress.data || !bookmarks.data) return <LoadingState className="min-h-dvh justify-center" />;
  const used = [...progress.data, ...bookmarks.data].flatMap((record) => (record.courseId ? [record.courseId] : []));
  const ticked = [...new Set([...settings.visibleCategories, ...extrasOf(used, catalog.data.courses)])];
  return <Choice settings={settings} initial={ticked} />;
}

function Choice({ settings, initial }: { settings: Settings; initial: ExtraCategory[] }) {
  const save = useSaveSettings();
  const [chosen, setChosen] = useState(initial);
  const profile = settings.profile;
  const finish = (visibleCategories: ExtraCategory[]) => save.mutate({ ...settings, visibleCategories, extrasChosen: true });

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-rule bg-sheet">
        <header className="border-b border-rule px-5 py-3">
          <h1 className="font-display text-2xl font-semibold">What do you want to study?</h1>
        </header>
        <div className="flex flex-col gap-4 px-5 py-5">
          {profile && (
            <label className="flex items-center gap-3 rounded-md border border-rule bg-print-soft/60 px-3 py-2.5">
              <input type="checkbox" checked disabled className="size-4 accent-[var(--print)]" />
              <span className="flex flex-col">
                <span className="font-medium">{SCHOOL_LEVEL_LABELS[profile.level]}</span>
                <span className="text-xs text-ink-muted">Always shown: {profile.year ? `${yearLabel(profile)} first` : 'your semester subjects'}.</span>
              </span>
            </label>
          )}
          <p className="text-sm text-ink-muted">Add any of these as well. You can change them later in Settings.</p>
          <ExtrasChoice value={chosen} onChange={setChosen} disabled={save.isPending} />
          {save.error && (
            <p role="alert" className="text-sm text-wrong">
              Your choice could not be saved: {save.error.message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="lg" loading={save.isPending} onClick={() => finish(chosen)} className="flex-1 justify-center">
              Continue
            </Button>
            <Button size="lg" variant="ghost" disabled={save.isPending} onClick={() => finish(settings.visibleCategories)}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
