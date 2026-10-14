/** Settings: the learners on this device (or in this account), to rename or remove. */
import { Pencil, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Feedback';
import { Field, Input } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { MAIN_LEARNER_ID } from '@/data/learners/learners';
import { useLearners } from '@/data/learners/useLearners';
import type { LearnerRecord } from '@/data/records';

export function LearnersSheet() {
  const learners = useLearners();
  return (
    <Sheet title="Learners">
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-muted">
          {learners.kind === 'device'
            ? 'Everyone who studies on this device. Each learner’s progress, calendar and settings are kept apart, on this device only. Signing in does not change this list.'
            : 'Everyone who studies with this account. Each learner’s progress, calendar and settings are kept apart, in the account.'}{' '}
          Switch learner from the Today page.
        </p>
        <ul className="flex flex-col divide-y divide-rule">
          {learners.list.map((learner) => (
            <LearnerRow key={learner.id} learner={learner} />
          ))}
        </ul>
      </div>
    </Sheet>
  );
}

function LearnerRow({ learner }: { learner: LearnerRecord }) {
  const learners = useLearners();
  const [mode, setMode] = useState<'view' | 'rename' | 'remove'>('view');
  const [name, setName] = useState(learner.name);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      setMode('view');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy(false);
    }
  };

  const rename = (event: FormEvent) => {
    event.preventDefault();
    void run(() => learners.rename(learner.id, name));
  };

  if (mode === 'rename')
    return (
      <li className="py-3">
        <form onSubmit={rename} className="flex flex-wrap items-end gap-2">
          <Field label={`New name for ${learner.name}`} error={error} className="min-w-48 flex-1">
            {(props) => <Input {...props} value={name} maxLength={40} autoComplete="off" onChange={(event) => setName(event.target.value)} />}
          </Field>
          <Button type="submit" size="sm" variant="primary" loading={busy}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('view')}>
            Cancel
          </Button>
        </form>
      </li>
    );

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <span className="flex items-center gap-2 font-medium">
        {learner.name}
        {learner.id === learners.active.id && <Tag tone="print">Studying now</Tag>}
      </span>
      {mode === 'remove' ? (
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-ink-muted">Remove {learner.name} and everything they saved? This cannot be undone.</span>
          <Button size="sm" variant="danger" loading={busy} onClick={() => void run(() => learners.remove(learner.id))}>
            Remove
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('view')}>
            Keep
          </Button>
          {error && (
            <span role="alert" className="text-wrong">
              {error}
            </span>
          )}
        </span>
      ) : (
        <span className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => setMode('rename')}>
            Rename
          </Button>
          {learner.id !== MAIN_LEARNER_ID && (
            <Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setMode('remove')}>
              Remove
            </Button>
          )}
        </span>
      )}
    </li>
  );
}
