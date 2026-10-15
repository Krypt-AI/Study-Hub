/**
 * Calendar (optional): the learner's weekly timetable for a semester and the important
 * dates to prepare for. Nothing here is required; upcoming dates also show on Today.
 * The semesters are the learner's own (domain/calendar/semesters.ts).
 */
import { CalendarPlus, FolderPlus, Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Field';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { Tabs } from '@/components/ui/Tabs';
import { useImportantDates, useTimetableClasses } from '@/data/queries';
import type { DayKey, ImportantDateRecord, TimetableClassRecord } from '@/data/records';
import { clashingClassIds, isDated, isValidSemester, semesterWeek, semesterWeekCount, upcomingDates } from '@/domain/calendar/calendar';
import { contentsLabel, defaultTerm, semesterContents, semesterCourseIds, type Term } from '@/domain/calendar/semesters';
import { AddSemesterDialog } from '@/features/semesters/AddSemesterDialog';
import { useTerms } from '@/features/semesters/useTerms';
import { dayKey, nowIso, relativeDay } from '@/lib/dates';
import { ClassDialog, type ClassDialogProps } from './ClassDialog';
import { DateDialog, type DateDialogProps } from './DateDialog';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';
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
  const { subjects, isLoading } = useSubjects();
  const terms = useTerms();
  const [term, setTerm] = useState<string>();
  const activeTerm = (term && terms.terms.some((entry) => entry.name === term) ? term : undefined) ?? defaultTerm(terms.terms, today) ?? '';
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState(today);
  const [editing, setEditing] = useState<Editing>();
  const [adding, setAdding] = useState(false);

  const classes = useTimetableClasses();
  const dates = useImportantDates();

  const termClasses = useMemo(() => (classes.data ?? []).filter((entry) => entry.term === activeTerm), [classes.data, activeTerm]);
  const clashing = useMemo(() => clashingClassIds(termClasses), [termClasses]);
  const shownTerm = terms.terms.find((entry) => entry.name === activeTerm);
  const semester = isDated(shownTerm?.semester) ? shownTerm.semester : undefined;

  const error = terms.error ?? classes.error ?? dates.error;
  if (error) return <ErrorState title="Your calendar could not be loaded" error={error} />;
  if (isLoading || terms.isLoading || !classes.data || !dates.data) return <LoadingState />;

  const allDates = dates.data;
  const editClass = (entry: TimetableClassRecord) => setEditing({ kind: 'class', initial: entry });
  const editDate = (entry: ImportantDateRecord) => setEditing({ kind: 'date', initial: entry });
  // Without a semester, a date belongs to none.
  const addDate = (day: DayKey) => setEditing({ kind: 'date', initial: shownTerm ? { term: activeTerm, date: day } : { date: day } });
  const setView = (next: View) => setSearchParams(next === 'week' ? {} : { view: next }, { replace: true });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Calendar"
        lead="Optional: add your weekly timetable and the dates of quizzes, tests and exams. The next important dates also show on Today."
        actions={
          <>
            {shownTerm && (
              <Button icon={<Plus className="size-4" />} onClick={() => setEditing({ kind: 'class', initial: { term: activeTerm } })}>
                Add class
              </Button>
            )}
            <Button variant="primary" icon={<CalendarPlus className="size-4" />} onClick={() => addDate(today)}>
              Add important date
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {shownTerm ? (
          <SemesterSheet
            key={activeTerm}
            term={shownTerm}
            terms={terms.terms}
            onTermChange={setTerm}
            today={today}
            classes={classes.data}
            dates={allDates}
            hasSubjects={semesterCourseIds(activeTerm, shownTerm.semester, classes.data).all.length > 0}
          />
        ) : (
          <Sheet title="Semester">
            <EmptyState
              title="Add your semester first"
              action={
                <Button variant="primary" icon={<FolderPlus className="size-4" />} onClick={() => setAdding(true)}>
                  Add semester
                </Button>
              }
            >
              Name the semester you are in, for example "Sem 1 2026". Your weekly timetable is kept under it; important dates can be added without one.
            </EmptyState>
            {adding && <AddSemesterDialog terms={terms.terms} onAdded={setTerm} onClose={() => setAdding(false)} />}
          </Sheet>
        )}

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

      {editing?.kind === 'class' && <ClassDialog initial={editing.initial} subjects={subjects} onClose={() => setEditing(undefined)} />}
      {editing?.kind === 'date' && <DateDialog initial={editing.initial} subjects={subjects} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

interface SemesterSheetProps {
  term: Term;
  terms: Term[];
  onTermChange: (term: string) => void;
  today: DayKey;
  classes: TimetableClassRecord[];
  dates: ImportantDateRecord[];
  hasSubjects: boolean;
}

/**
 * Which semester is shown, and its first and last day (used to number weeks and bound the timetable).
 * Semesters can be added here; one the learner added can be removed with its classes and dates.
 */
function SemesterSheet({ term, terms, onTermChange, today, classes, dates, hasSubjects }: SemesterSheetProps) {
  const record = term.semester;
  const [draft, setDraft] = useState({ startsOn: record?.startsOn ?? '', endsOn: record?.endsOn ?? '' });
  const [submitted, setSubmitted] = useState(false);
  const [adding, setAdding] = useState(false);
  const { saveSemester, removeSemester } = useCalendarMutations();
  const changed = draft.startsOn !== (record?.startsOn ?? '') || draft.endsOn !== (record?.endsOn ?? '');
  const invalid = !isValidSemester(draft);
  const contents = semesterContents(term.name, classes, dates);
  const termClassCount = contents.classes.length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    await saveSemester.mutateAsync({ ...record, term: term.name, ...draft, updatedAt: nowIso() });
  };

  const semester = isDated(record) ? record : undefined;
  const week = semester ? semesterWeek(today, semester) : undefined;
  const status = !semester
    ? 'Add the first and last day to number the teaching weeks. Until then, classes repeat every week.'
    : week !== undefined
      ? `Week ${week} of ${semesterWeekCount(semester)}`
      : today < semester.startsOn
        ? `Starts ${relativeDay(semester.startsOn, today)}`
        : 'This semester has ended.';

  return (
    <Sheet title="Semester" aside={<span>{termClassCount} class{termClassCount === 1 ? '' : 'es'} a week</span>}>
      <form onSubmit={(event) => void submit(event)} className="flex flex-wrap items-end gap-4">
        <Field label="Semester" className="w-44">
          {(props) => (
            <Select {...props} value={term.name} onChange={(event) => onTermChange(event.target.value)}>
              {terms.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
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
        <Button type="button" variant="ghost" icon={<FolderPlus className="size-4" />} onClick={() => setAdding(true)}>
          Add semester
        </Button>
        <ConfirmDeleteButton
          label="Remove semester"
          question={`Remove ${term.name} with its ${contentsLabel(contents)}?`}
          loading={removeSemester.isPending}
          onConfirm={() => void removeSemester.mutateAsync({ term: term.name, ...contents }).then(() => onTermChange(''))}
        />
        <p className="basis-full text-sm text-ink-muted">
          {status}
          {!hasSubjects && ' No subjects chosen yet: choose them on the Courses page, or add classes and dates by name.'}
        </p>
      </form>
      {adding && <AddSemesterDialog terms={terms} onAdded={onTermChange} onClose={() => setAdding(false)} />}
    </Sheet>
  );
}
