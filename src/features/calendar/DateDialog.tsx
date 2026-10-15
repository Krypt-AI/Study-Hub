/** Add or edit an important date: a quiz, test, midterm, final exam, deadline, or an extra or make-up class. */
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import type { DayKey, ImportantDateKind, ImportantDateRecord } from '@/data/records';
import { defaultDateTitle, IMPORTANT_KIND_LABELS, isValidTimeRange } from '@/domain/calendar/calendar';
import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { useCalendarMutations } from './useCalendarMutations';
import { SubjectSelect } from './SubjectSelect';
import { type Subject, subjectShortName } from './useSubjects';

export interface DateDialogProps {
  /** The date to edit, or the fields to start a new one with. */
  initial: ImportantDateRecord | { term?: string; date: DayKey };
  subjects: Subject[];
  onClose: () => void;
}

interface Draft {
  kind: ImportantDateKind;
  courseId: string;
  title: string;
  date: DayKey;
  /** Empty for a single day. */
  endDate: DayKey | '';
  start: string;
  end: string;
  location: string;
  details: string;
}

const isSaved = (initial: DateDialogProps['initial']): initial is ImportantDateRecord => 'id' in initial;

const defaultTitle = (kind: ImportantDateKind, subject?: Subject) => defaultDateTitle(kind, subject && subjectShortName(subject));

export function DateDialog({ initial, subjects, onClose }: DateDialogProps) {
  const existing = isSaved(initial) ? initial : undefined;
  const [draft, setDraft] = useState<Draft>({
    kind: existing?.kind ?? 'quiz',
    courseId: existing?.courseId ?? '',
    title: existing?.title ?? '',
    date: initial.date,
    endDate: existing?.endDate ?? '',
    start: existing?.start ?? '',
    end: existing?.end ?? '',
    location: existing?.location ?? '',
    details: existing?.details ?? '',
  });
  const [submitted, setSubmitted] = useState(false);
  const { saveDate, deleteDate } = useCalendarMutations();
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const subject = subjects.find((entry) => entry.courseId === draft.courseId);
  const title = draft.title.trim() || defaultTitle(draft.kind, subject);
  const timeInvalid = Boolean(draft.end) && !isValidTimeRange(draft.start, draft.end);
  const dateError = submitted && !draft.date ? 'Choose the day.' : undefined;
  const endInvalid = Boolean(draft.endDate) && draft.endDate < draft.date;
  const endError = submitted && endInvalid ? 'The last day must be on or after the first.' : undefined;
  const timeError = submitted && timeInvalid ? 'The end must be after the start.' : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!draft.date || timeInvalid || endInvalid) return;
    const at = nowIso();
    await saveDate.mutateAsync({
      id: existing?.id ?? newId(),
      term: existing?.term ?? initial.term,
      courseId: draft.courseId || undefined,
      title,
      kind: draft.kind,
      date: draft.date,
      endDate: draft.endDate && draft.endDate > draft.date ? draft.endDate : undefined,
      start: draft.start || undefined,
      end: (draft.start && draft.end) || undefined,
      location: draft.location.trim() || undefined,
      details: draft.details.trim() || undefined,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    });
    onClose();
  };

  const remove = async () => {
    if (!existing) return;
    await deleteDate.mutateAsync(existing.id);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={existing ? 'Edit important date' : 'Add an important date'}>
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What">
            {(props) => (
              <Select {...props} value={draft.kind} onChange={(event) => update({ kind: event.target.value as ImportantDateKind })}>
                {Object.entries(IMPORTANT_KIND_LABELS).map(([kind, label]) => (
                  <option key={kind} value={kind}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Subject">
            {(props) => <SubjectSelect {...props} subjects={subjects} value={draft.courseId} onChange={(event) => update({ courseId: event.target.value })} />}
          </Field>
        </div>
        <Field label="Name" hint={draft.title ? undefined : `Leave empty to use "${defaultTitle(draft.kind, subject)}".`}>
          {(props) => <Input {...props} value={draft.title} onChange={(event) => update({ title: event.target.value })} placeholder={defaultTitle(draft.kind, subject)} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Day" error={dateError}>
            {(props) => <Input {...props} type="date" required value={draft.date} onChange={(event) => update({ date: event.target.value })} />}
          </Field>
          <Field label="Last day" hint="Optional: for something that lasts several days, such as a holiday week." error={endError}>
            {(props) => <Input {...props} type="date" min={draft.date} value={draft.endDate} onChange={(event) => update({ endDate: event.target.value })} />}
          </Field>
          <Field label="Starts" hint="Optional." error={timeError}>
            {(props) => <Input {...props} type="time" value={draft.start} onChange={(event) => update({ start: event.target.value })} />}
          </Field>
          <Field label="Ends" hint="Optional.">
            {(props) => <Input {...props} type="time" value={draft.end} disabled={!draft.start} onChange={(event) => update({ end: event.target.value })} />}
          </Field>
        </div>
        <Field label="Venue" hint="Optional.">
          {(props) => <Input {...props} value={draft.location} onChange={(event) => update({ location: event.target.value })} placeholder="e.g. DSS hall" />}
        </Field>
        <Field label="Details" hint="Optional: chapters covered, what to bring, weighting.">
          {(props) => <Textarea {...props} rows={3} value={draft.details} onChange={(event) => update({ details: event.target.value })} />}
        </Field>
        <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          {existing && <ConfirmDeleteButton question="Delete this date?" onConfirm={() => void remove()} loading={deleteDate.isPending} />}
          <span className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saveDate.isPending}>
            {existing ? 'Save' : 'Add date'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
