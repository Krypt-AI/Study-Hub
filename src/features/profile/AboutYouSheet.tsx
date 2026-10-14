/**
 * Settings › About you: the Welcome page's answers. A new level or year is confirmed first, since it
 * changes which courses come first; progress is never touched.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/useToast';
import { useSaveSettings } from '@/data/queries';
import type { Settings } from '@/data/records';
import { type LearnerProfile, yearLabel } from '@/domain/profile/profile';
import { draftFrom, profileFrom } from './profileDraft';
import { ProfileFields } from './ProfileFields';

const sameYear = (a: LearnerProfile, b: LearnerProfile) => a.level === b.level && a.year === b.year;

export function AboutYouSheet({ settings }: { settings: Settings }) {
  const save = useSaveSettings();
  const toast = useToast();
  const [draft, setDraft] = useState(draftFrom(settings.profile));
  const [confirming, setConfirming] = useState(false);
  const profile = profileFrom(draft);
  const saved = settings.profile;
  const dirty = profile !== undefined && JSON.stringify(profile) !== JSON.stringify(saved);

  const commit = () => {
    if (!profile) return;
    save.mutate({ ...settings, profile }, { onSuccess: () => toast.show('Saved', 'success') });
    setConfirming(false);
  };

  return (
    <Sheet title="About you">
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (profile && saved && !sameYear(profile, saved)) setConfirming(true);
          else commit();
        }}
      >
        <ProfileFields draft={draft} onChange={setDraft} />
        <Button type="submit" variant="primary" disabled={!dirty} loading={save.isPending} className="self-start">
          Save
        </Button>
      </form>
      {profile && (
        <Dialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title={`Change to ${yearLabel(profile)}?`}
          footer={
            <>
              <Button onClick={() => setConfirming(false)}>Keep {saved ? yearLabel(saved) : 'it'}</Button>
              <Button variant="primary" onClick={commit}>
                Change
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-muted">Courses for {yearLabel(profile)} will come first. Everything you have done in every course is kept.</p>
        </Dialog>
      )}
    </Sheet>
  );
}
