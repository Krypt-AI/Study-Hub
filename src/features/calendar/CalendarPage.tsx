/**
 * Calendar (optional): the learner's weekly timetable for a semester and the important
 * dates to prepare for. Nothing here is required; upcoming dates also show on Today.
 */
import { CalendarPlus, Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ErrorState, LoadingState } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { Tabs } from '@/components/ui/Tabs';
import { useImportantDates, useSemesters, useTimetableClasses } from '@/data/queries';
import type { DayKey, ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { clashingClassIds, isValidSemester, semesterWeek, semesterWeekCount, upcomingDates } from '@/domain/calendar/calendar';
import { dayKey, nowIso, relativeDay } from '@/lib/dates';
import { ClassDialog, type ClassDialogProps } from './ClassDialog';
import { DateDialog, type DateDialogProps } from './DateDialog';
import { DatesList } from './DatesList';
import { MonthView } from './MonthView';
import { useCalendarMutations } from './useCalendarMutations';
import { useSubjects } from './useSubjects';
import { WeekView } from './WeekView';

type View = 'week' | 'month' | 'dates';
const VIEWS: View[] = ['week', 'month', 'dates'];
const isView = (value: string | null): value is View => VIEWS.includes(value as View);

type Editing = { kind: 'class'; initial: ClassDialogProps['initial'] } | { kind: 'date'; initial: DateDialogProps['initial'] };

export default function CalendarPage() {
  const today = dayKey();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = isView(searchParams.get('view')) ? (searchParams.get('view') as View) : 'week';
  const { terms, currentTerm, subjects, isLoading } = useSubjects();
  const [term, setTerm] = useState<string>();
  const activeTerm = term ?? currentTerm;
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(today);
  const [editing, setEditing] = useState<Editing>();

  const semesters = useSemesters();
  const classes = useTimetableClasses();
  const dates = useImportantDates();

  const termClasses = useMemo(() => (classes.data ?? []).filter((entry) => entry.term === activeTerm), [classes.data, activeTerm]);
  const clashing = useMemo(() => clashingClassIds(termClasses), [termClasses]);
  const semester = semesters.data?.find((entry) => entry.term === activeTerm);

  const error = semesters.error ?? classes.error ?? dates.error;
  if (error) return <ErrorState title="Your calendar could not be loaded" error={error} />;
  if (isLoading || !semesters.data || !classes.data || !dates.data) return <LoadingState />;

  const allDates = dates.data;
  const termSubjects = subjects.filter((subject) => !subject.term || subject.term === activeTerm);
  const editClass = (entry: TimetableClassRecord) => setEditing({ kind: 'class', initial: entry });
  const editDate = (entry: ImportantDateRecord) => setEditing({ kind: 'date', initial: entry });
  const addDate = (day: DayKey) => setEditing({ kind: 'date', initial: { term: activeTerm, date: day } });
  const setView = (next: View) => setSearchParams(next === 'week' ? {} : { view: next }, { replace: true });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Calendar"
        lead="Optional: add your weekly timetable and the dates of quizzes, tests and exams. The next important dates also show on Today."
        actions={
          <>
            <Button icon={<Plus className="size-4" />} onClick={() => setEditing({ kind: 'class', initial: { term: activeTerm } })}>
              Add class
            </Button>
            <Button variant="primary" icon={<CalendarPlus className="size-4" />} onClick={() => addDate(today)}>
              Add important date
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <SemesterSheet key={activeTerm} term={activeTerm} terms={terms} onTermChange={setTerm} semester={semester} today={today} classCount={termClasses.length} />

        <div className="flex flex-col gap-4">
          <Tabs
            label="Calendar view"
            value={view}
            onChange={setView}
            items={[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'dates', label: 'Important dates', count: upcomingDates(allDates, today).length },
            ]}
          />
          {view === 'week' && (
            <WeekView anchor={weekAnchor} onAnchorChange={setWeekAnchor} today={today} classes={termClasses} dates={allDates} semester={semester} clashing={clashing} onEditClass={editClass} onEditDate={editDate} />
          )}
          {view === 'month' && (
            <MonthView
              month={month}
              onMonthChange={setMonth}
              selected={selectedDay}
              onSelect={setSelectedDay}
              today={today}
              classes={termClasses}
              dates={allDates}
              semester={semester}
              clashing={clashing}
              onEditClass={editClass}
              onEditDate={editDate}
              onAddDate={addDate}
            />
          )}
          {view === 'dates' && <DatesList dates={allDates} today={today} semester={semester} onEditDate={editDate} />}
        </div>
      </div>

      {editing?.kind === 'class' && <ClassDialog initial={editing.initial} subjects={termSubjects} onClose={() => setEditing(undefined)} />}
      {editing?.kind === 'date' && <DateDialog initial={editing.initial} subjects={termSubjects} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

interface SemesterSheetProps {
  term: string;
  terms: string[];
  onTermChange: (term: string) => void;
  semester?: SemesterRecord;
  today: DayKey;
  classCount: number;
}

/** Which semester is shown, and its first and last day (used to number weeks and bound the timetable). */
function SemesterSheet({ term, terms, onTermChange, semester, today, classCount }: SemesterSheetProps) {
  const [draft, setDraft] = useState({ startsOn: semester?.startsOn ?? '', endsOn: semester?.endsOn ?? '' });
  const [submitted, setSubmitted] = useState(false);
  const { saveSemester } = useCalendarMutations();
  const changed = draft.startsOn !== (semester?.startsOn ?? '') || draft.endsOn !== (semester?.endsOn ?? '');
  const invalid = !isValidSemester(draft);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    await saveSemester.mutateAsync({ term, ...draft, updatedAt: nowIso() });
  };

  const week = semester ? semesterWeek(today, semester) : undefined;
  const status = !semester
    ? 'Add the first and last day to number the teaching weeks. Until then, classes repeat every week.'
    : week !== undefined
      ? `Week ${week} of ${semesterWeekCount(semester)}`
      : today < semester.startsOn
        ? `Starts ${relativeDay(semester.startsOn, today)}`
        : 'This semester has ended.';

  return (
    <Sheet title="Semester" aside={<span>{classCount} class{classCount === 1 ? '' : 'es'} a week</span>}>
      <form onSubmit={(event) => void submit(event)} className="flex flex-wrap items-end gap-4">
        <Field label="Semester" className="w-44">
          {(props) => (
            <Select {...props} value={term} onChange={(event) => onTermChange(event.target.value)}>
              {terms.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="First day" className="w-44" error={submitted && invalid ? 'The last day must be on or after the first.' : undefined}>
          {(props) => <Input {...props} type="date" value={draft.startsOn} onChange={(event) => setDraft((current) => ({ ...current, startsOn: event.target.value }))} />}
        </Field>
        <Field label="Last day" className="w-44">
          {(props) => <Input {...props} type="date" value={draft.endsOn} onChange={(event) => setDraft((current) => ({ ...current, endsOn: event.target.value }))} />}
        </Field>
        <Button type="submit" disabled={!changed} loading={saveSemester.isPending}>
          Save dates
        </Button>
        <p className="basis-full text-sm text-ink-muted">{status}</p>
      </form>
    </Sheet>
  );
}
