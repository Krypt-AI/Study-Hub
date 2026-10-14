/**
 * A month at a glance: important dates on their days and how many classes meet. Choosing a
 * day lists its agenda underneath, where a date can be added for that day.
 */
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import type { DatedSemester, DayKey, ImportantDateRecord, TimetableClassRecord } from '@/data/records';
import { addMonths, classesOn, datesOn, monthGrid, WEEKDAYS } from '@/domain/calendar/calendar';
import { parseDayKey } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { ClassItem, DateItem } from './AgendaItems';

export interface MonthViewProps {
  /** "YYYY-MM". */
  month: string;
  onMonthChange: (month: string) => void;
  selected: DayKey;
  onSelect: (day: DayKey) => void;
  today: DayKey;
  classes: TimetableClassRecord[];
  dates: ImportantDateRecord[];
  /** The shown semester, when its dates are known. */
  semester?: DatedSemester;
  clashing: Set<string>;
  onEditClass: (entry: TimetableClassRecord) => void;
  onEditDate: (entry: ImportantDateRecord) => void;
  onAddDate: (day: DayKey) => void;
}

const MARKERS_SHOWN = 2;

export function MonthView({ month, onMonthChange, selected, onSelect, today, classes, dates, semester, clashing, onEditClass, onEditDate, onAddDate }: MonthViewProps) {
  const semesters = semester ? [semester] : [];
  const title = parseDayKey(`${month}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const selectedClasses = classesOn(selected, classes, semesters);
  const selectedDates = datesOn(selected, dates);
  const thisMonth = today.slice(0, 7);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))}>
          <ChevronLeft className="size-4" />
        </IconButton>
        <IconButton label="Next month" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight className="size-4" />
        </IconButton>
        <p className="font-medium text-ink">{title}</p>
        {month !== thisMonth && (
          <Button size="sm" variant="ghost" onClick={() => onMonthChange(thisMonth)}>
            This month
          </Button>
        )}
      </div>

      <div role="grid" aria-label={title} className="overflow-hidden rounded-md border border-rule">
        <div role="row" className="grid grid-cols-7 border-b border-rule bg-sheet-2">
          {WEEKDAYS.map((day) => (
            <span key={day.value} role="columnheader" className="px-2 py-1.5 text-xs font-medium text-ink-muted">
              {day.short}
            </span>
          ))}
        </div>
        {monthGrid(month).map((week) => (
          <div key={week[0]} role="row" className="grid grid-cols-7 border-b border-rule last:border-b-0">
            {week.map((day) => {
              const inMonth = day.startsWith(month);
              const dayDates = datesOn(day, dates);
              const classCount = classesOn(day, classes, semesters).length;
              const isSelected = day === selected;
              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={`${parseDayKey(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${dayDates.length} important date${dayDates.length === 1 ? '' : 's'}, ${classCount} class${classCount === 1 ? '' : 'es'}`}
                  onClick={() => onSelect(day)}
                  className={cn(
                    'flex min-h-16 min-w-0 flex-col items-stretch gap-1 border-r border-rule p-1.5 text-left transition-colors duration-150 last:border-r-0 sm:min-h-24',
                    isSelected ? 'bg-print-soft' : 'hover:bg-sheet-2',
                    !inMonth && 'text-ink-faint',
                  )}
                >
                  <span className={cn('tabular self-start rounded px-1 text-xs', day === today && 'bg-print font-semibold text-on-print')}>{parseDayKey(day).getDate()}</span>
                  {/* Small screens: a dot per date. Wider: the first few titles. */}
                  <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                    {dayDates.map((entry) => (
                      <span key={entry.id} className="size-1.5 rounded-full bg-print" />
                    ))}
                  </span>
                  <span className="hidden flex-col gap-0.5 sm:flex" aria-hidden>
                    {dayDates.slice(0, MARKERS_SHOWN).map((entry) => (
                      <span key={entry.id} className="truncate rounded bg-print-soft px-1 text-[0.6875rem] text-print-strong">
                        {entry.title}
                      </span>
                    ))}
                    {dayDates.length > MARKERS_SHOWN && <span className="text-[0.6875rem] text-ink-muted">+{dayDates.length - MARKERS_SHOWN} more</span>}
                    {classCount > 0 && inMonth && <span className="text-[0.6875rem] text-ink-faint">{classCount} class{classCount === 1 ? '' : 'es'}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <section aria-label="Selected day" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-ink">{parseDayKey(selected).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <Button size="sm" icon={<CalendarPlus className="size-3.5" />} onClick={() => onAddDate(selected)}>
            Add a date on this day
          </Button>
        </div>
        {selectedDates.length === 0 && selectedClasses.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing scheduled.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedDates.map((entry) => (
              <DateItem key={entry.id} entry={entry} onSelect={() => onEditDate(entry)} />
            ))}
            {selectedClasses.map((entry) => (
              <ClassItem key={entry.id} entry={entry} clashing={clashing.has(entry.id)} onSelect={() => onEditClass(entry)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
