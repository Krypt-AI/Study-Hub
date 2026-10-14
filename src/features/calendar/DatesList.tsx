/** Every important date: upcoming ones with a countdown, past ones folded away. */
import { EmptyState } from '@/components/ui/Feedback';
import type { DatedSemester, DayKey, ImportantDateRecord } from '@/data/records';
import { isMultiDay, lastDayOf, pastDates, semesterWeek, upcomingDates, whenLabel } from '@/domain/calendar/calendar';
import { parseDayKey } from '@/lib/dates';
import { DateItem } from './AgendaItems';

export interface DatesListProps {
  dates: ImportantDateRecord[];
  today: DayKey;
  /** The shown semester, when its dates are known. */
  semester?: DatedSemester;
  onEditDate: (entry: ImportantDateRecord) => void;
}

const fullDate = (day: DayKey) => parseDayKey(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export function DatesList({ dates, today, semester, onEditDate }: DatesListProps) {
  const upcoming = upcomingDates(dates, today);
  const past = pastDates(dates, today);

  const describe = (entry: ImportantDateRecord) => {
    const week = semester ? semesterWeek(entry.date, semester) : undefined;
    const days = isMultiDay(entry) ? `${fullDate(entry.date)} to ${fullDate(lastDayOf(entry))}` : fullDate(entry.date);
    return week === undefined ? days : `${days}, week ${week}`;
  };

  if (dates.length === 0) {
    return (
      <EmptyState title="No important dates yet">
        Add quizzes, tests, midterms, final exams and deadlines. The next ones also appear on Today with a countdown.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {upcoming.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing coming up.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {upcoming.map((entry) => (
            <li key={entry.id} className="grid gap-x-4 gap-y-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
              <div className="text-sm">
                <p className="font-medium text-ink">{whenLabel(entry, today)}</p>
                <p className="text-xs text-ink-muted">{describe(entry)}</p>
              </div>
              <DateItem entry={entry} onSelect={() => onEditDate(entry)} />
            </li>
          ))}
        </ol>
      )}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">Past dates ({past.length})</summary>
          <ol className="mt-3 flex flex-col gap-2 opacity-80">
            {past.map((entry) => (
              <li key={entry.id} className="grid gap-x-4 gap-y-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-start">
                <p className="text-xs text-ink-muted">{describe(entry)}</p>
                <DateItem entry={entry} onSelect={() => onEditDate(entry)} />
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
