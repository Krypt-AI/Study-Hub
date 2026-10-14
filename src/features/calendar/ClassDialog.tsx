/** Add or edit a weekly class in the timetable. */
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select } from '@/components/ui/Field';
import type { ClassKind, TimetableClassRecord } from '@/data/records';
import { CLASS_KIND_LABELS, isValidTimeRange, WEEKDAYS } from '@/domain/calendar/calendar';
import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/ids';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
import { useCalendarMutations } from './useCalendarMutations';
import { SubjectSelect } from './SubjectSelect';
import { type Subject, subjectLabel } from './useSubjects';

export interface ClassDialogProps {
  /** The class to edit, or the fields to start a new one with. */
  initial: TimetableClassRecord | { term: string; weekday?: number };
  subjects: Subject[];
  onClose: () => void;
}

interface Draft {
  courseId: string;
  title: string;
  kind: ClassKind;
  weekday: number;
  start: string;
  end: string;
  location: string;
}

const isSaved = (initial: ClassDialogProps['initial']): initial is TimetableClassRecord => 'id' in initial;

export function ClassDialog({ initial, subjects, onClose }: ClassDialogProps) {
  const existing = isSaved(initial) ? initial : undefined;
  const [draft, setDraft] = useState<Draft>({
    courseId: existing?.courseId ?? '',
    title: existing?.title ?? '',
    kind: existing?.kind ?? 'lecture',
    weekday: initial.weekday ?? 1,
    start: existing?.start ?? '08:00',
    end: existing?.end ?? '10:00',
    location: existing?.location ?? '',
  });
  const [submitted, setSubmitted] = useState(false);
  const { saveClass, deleteClass } = useCalendarMutations();
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  const subject = subjects.find((entry) => entry.courseId === draft.courseId);
  const title = draft.title.trim() || (subject ? subjectLabel(subject) : '');
  const titleError = submitted && !title ? 'Give the class a name or choose a subject.' : undefined;
  const timeError = submitted && !isValidTimeRange(draft.start, draft.end) ? 'The class must end after it starts.' : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!title || !isValidTimeRange(draft.start, draft.end)) return;
    const at = nowIso();
    await saveClass.mutateAsync({
      id: existing?.id ?? newId(),
      term: initial.term,
      courseId: draft.courseId || undefined,
      title,
      kind: draft.kind,
      weekday: draft.weekday,
      start: draft.start,
      end: draft.end,
      location: draft.location.trim() || undefined,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    });
    onClose();
  };

  const remove = async () => {
    if (!existing) return;
    await deleteClass.mutateAsync(existing.id);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} title={existing ? 'Edit class' : 'Add a class'}>
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4 p-4">
        <p className="text-sm text-ink-muted">Repeats every week of {initial.term}.</p>
        <Field label="Subject" hint="Optional: link the class to the course you study for it. Today then links to it.">
          {(props) => <SubjectSelect {...props} subjects={subjects} value={draft.courseId} onChange={(event) => update({ courseId: event.target.value })} />}
        </Field>
        <Field label="Name" error={titleError} hint={subject && !draft.title ? `Leave empty to use "${subjectLabel(subject)}".` : undefined}>
          {(props) => <Input {...props} value={draft.title} onChange={(event) => update({ title: event.target.value })} placeholder={subject ? subjectLabel(subject) : 'e.g. Statistics lab'} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            {(props) => (
              <Select {...props} value={draft.kind} onChange={(event) => update({ kind: event.target.value as ClassKind })}>
                {Object.entries(CLASS_KIND_LABELS).map(([kind, label]) => (
                  <option key={kind} value={kind}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Day">
            {(props) => (
              <Select {...props} value={draft.weekday} onChange={(event) => update({ weekday: Number(event.target.value) })}>
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Starts" error={timeError}>
            {(props) => <Input {...props} type="time" required value={draft.start} onChange={(event) => update({ start: event.target.value })} />}
          </Field>
          <Field label="Ends">
            {(props) => <Input {...props} type="time" required value={draft.end} onChange={(event) => update({ end: event.target.value })} />}
          </Field>
        </div>
        <Field label="Room" hint="Optional.">
          {(props) => <Input {...props} value={draft.location} onChange={(event) => update({ location: event.target.value })} placeholder="e.g. BW-2-L03" />}
        </Field>
        <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
          {existing && (
            <ConfirmDeleteButton question="Delete this class?" onConfirm={() => void remove()} loading={deleteClass.isPending} />
          )}
          <span className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saveClass.isPending}>
            {existing ? 'Save' : 'Add class'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
