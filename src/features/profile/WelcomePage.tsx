/**
 * The first screen for a learner without a profile: an optional nickname, their age and where they
 * study. The answers choose which courses are shown; nothing else is asked for.
 */
import { type FormEvent, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useLearners } from '@/data/learners/useLearners';
import { useSaveSettings } from '@/data/queries';
import type { Settings } from '@/data/records';
import { useAuth } from '@/features/auth/useAuth';
import { BringDeviceProgress } from '@/features/learners/BringDeviceProgress';
import { LearnerSwitcher } from '@/features/learners/LearnerSwitcher';
import { draftFrom, profileFrom } from './profileDraft';
import { ProfileFields } from './ProfileFields';

const MAX_NAME_LENGTH = 40;

export function WelcomePage({ settings }: { settings: Settings }) {
  const learners = useLearners();
  const save = useSaveSettings();
  const auth = useAuth();
  const location = useLocation();
  const [name, setName] = useState('');
  const [draft, setDraft] = useState(draftFrom());
  const profile = profileFrom(draft);

  const start = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    if (name.trim()) await learners.rename(learners.active.id, name.trim());
    save.mutate({ ...settings, profile });
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-10">
      <div className="w-full max-w-md">
        <BringDeviceProgress />
      </div>
      <div className="w-full max-w-md rounded-md border border-rule bg-sheet">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-print-line px-5 py-3">
          <h1 className="font-display text-2xl font-semibold">Welcome to Study Hub</h1>
          {/* Someone added by mistake, or a sibling at the wrong turn, can go back to another learner. */}
          {learners.list.length > 1 && <LearnerSwitcher />}
        </header>
        {/* The header stays outside the form: the learner switcher holds a form of its own. */}
        <form onSubmit={(event) => void start(event)} className="flex flex-col gap-5 px-5 py-5">
          <p className="text-ink-muted">A few quick questions, so you see the right courses.</p>
          <Field label="What should we call you? (you can skip this)">
            {(props) => <Input {...props} value={name} maxLength={MAX_NAME_LENGTH} autoComplete="nickname" placeholder={learners.active.name} onChange={(event) => setName(event.target.value)} className="max-w-xs" />}
          </Field>
          <ProfileFields draft={draft} onChange={setDraft} />
          <p className="text-xs text-ink-faint">Your age is only used to suggest your school year. You can change these answers in Settings.</p>
          {save.error && (
            <p role="alert" className="text-sm text-wrong">
              Your answers could not be saved: {save.error.message}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" disabled={!profile} loading={save.isPending} className="justify-center">
            Start
          </Button>
          {auth.status === 'guest' && (
            <p className="border-t border-rule pt-4 text-sm text-ink-muted">
              Have an account?{' '}
              <Link to={`/sign-in?next=${encodeURIComponent(location.pathname + location.search)}`} className="text-print-strong hover:underline">
                Sign in
              </Link>{' '}
              to bring back your answers.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
