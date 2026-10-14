/** Add a semester that is not in the catalog yet, by name, with its first and last day if known. */
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Field';
import { isValidSemester } from '@/domain/calendar/calendar';
import { checkSemesterName, MAX_SEMESTER_NAME_LENGTH, type Term } from '@/domain/calendar/semesters';
import { useCalendarMutations } from '@/features/calendar/useCalendarMutations';
import { nowIso } from '@/lib/dates';

export function AddSemesterDialog({ terms, onAdded, onClose }: { terms: Term[]; onAdded: (term: string) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { saveSemester } = useCalendarMutations();

  const checked = checkSemesterName(name, terms);
  const datesGiven = Boolean(startsOn || endsOn);
  const datesError = datesGiven && !isValidSemester({ startsOn, endsOn }) ? 'Give both days, the last on or after the first, or leave both empty.' : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if ('error' in checked || datesError) return;
    const at = nowIso();
    await saveSemester.mutateAsync({ term: checked.name, ...(datesGiven ? { startsOn, endsOn } : {}), addedByLearner: true, createdAt: at, updatedAt: at });
    onAdded(checked.name);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title="Add a semester">
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4 p-4">
        <p className="text-sm text-ink-muted">For a semester whose subjects are not in Study Hub yet: you can still keep its timetable and important dates.</p>
        <Field label="Name" error={submitted && 'error' in checked ? checked.error : undefined}>
          {(props) => <Input {...props} value={name} maxLength={MAX_SEMESTER_NAME_LENGTH + 10} autoComplete="off" placeholder="e.g. Sem 2 2026" onChange={(event) => setName(event.target.value)} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First day" hint="Optional." error={submitted ? datesError : undefined}>
            {(props) => <Input {...props} type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />}
          </Field>
          <Field label="Last day" hint="Optional.">
            {(props) => <Input {...props} type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />}
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-rule pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saveSemester.isPending}>
            Add semester
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
