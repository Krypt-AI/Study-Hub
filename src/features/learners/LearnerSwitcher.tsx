/**
 * "Who is studying?": shows the open profile and lets someone else on this device (or account)
 * take over, or add themselves. Switching opens only that learner's progress.
 */
import { Check, UserPlus, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Field';
import { useLearners } from '@/data/learners/useLearners';
import { cn } from '@/lib/cn';

export function LearnerSwitcher() {
  const learners = useLearners();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" icon={<Users className="size-4" />} onClick={() => setOpen(true)}>
        {learners.active.name} · Switch profile
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Who is studying?">
        <div className="flex flex-col gap-4 p-4">
          <ul className="flex flex-col gap-2" aria-label="Profiles">
            {learners.list.map((learner) => {
              const current = learner.id === learners.active.id;
              return (
                <li key={learner.id}>
                  <button
                    type="button"
                    aria-current={current ? 'true' : undefined}
                    onClick={() => {
                      learners.switchTo(learner.id);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-4 py-2 text-left text-base transition-colors',
                      current ? 'border-print bg-print-soft font-semibold' : 'border-rule hover:border-print-line',
                    )}
                  >
                    {learner.name}
                    {current && <Check className="size-4 text-print" aria-label="Studying now" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <AddLearnerForm onAdded={() => setOpen(false)} />
          <p className="text-xs text-ink-faint">
            {learners.kind === 'device'
              ? 'Each profile has its own progress, calendar and settings, saved on this device only.'
              : 'Each profile has its own progress, calendar and settings, saved in this account.'}
          </p>
        </div>
      </Dialog>
    </>
  );
}

function AddLearnerForm({ onAdded }: { onAdded: () => void }) {
  const learners = useLearners();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await learners.add(name);
      onAdded();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2 border-t border-rule pt-4">
      <Field label="New profile’s name" hint="A first name or a nickname." error={error}>
        {(props) => (
          <Input
            {...props}
            value={name}
            autoComplete="off"
            maxLength={40}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
            }}
          />
        )}
      </Field>
      <Button type="submit" icon={<UserPlus className="size-4" />} loading={busy} className="self-start">
        Add profile
      </Button>
    </form>
  );
}
