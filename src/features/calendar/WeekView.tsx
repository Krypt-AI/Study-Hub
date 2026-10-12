/** One week of the timetable, with that week's important dates on their days. */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import type { DayKey, ImportantDateRecord, SemesterRecord, TimetableClassRecord } from '@/data/records';
import { classesOn, datesOn, isoWeekday, semesterWeek, startOfWeek, WEEKDAYS, weekDays } from '@/domain/calendar/calendar';
import { addDays, parseDayKey } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { ClassItem, DateItem } from './AgendaItems';

export interface WeekViewProps {
  /** Any day in the week shown. */
  anchor: DayKey;
  onAnchorChange: (day: DayKey) => void;
  today: DayKey;
  classes: TimetableClassRecord[];
  dates: ImportantDateRecord[];
  semester?: SemesterRecord;
  clashing: Set<string>;
  onEditClass: (entry: TimetableClassRecord) => void;
  onEditDate: (entry: ImportantDateRecord) => void;
}

const COLUMNS: Record<number, string> = { 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7' };

const dayLabel = (day: DayKey) => parseDayKey(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function WeekView({ anchor, onAnchorChange, today, classes, dates, semester, clashing, onEditClass, onEditDate }: WeekViewProps) {
  const days = weekDays(anchor);
  const semesters = semester ? [semester] : [];
  const agenda = days.map((day) => ({ day, classes: classesOn(day, classes, semesters), dates: datesOn(day, dates) }));
  // Weekends only take a column when something happens on them.
  const shown = agenda.filter(({ day, classes: dayClasses, dates: dayDates }) => isoWeekday(day) <= 5 || dayClasses.length > 0 || dayDates.length > 0);
  const week = semester ? semesterWeek(days[0] ?? anchor, semester) ?? semesterWeek(days[6] ?? anchor, semester) : undefined;
  const isThisWeek = startOfWeek(anchor) === startOfWeek(today);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Previous week" onClick={() => onAnchorChange(addDays(anchor, -7))}>
          <ChevronLeft className="size-4" />
        </IconButton>
        <IconButton label="Next week" onClick={() => onAnchorChange(addDays(anchor, 7))}>
          <ChevronRight className="size-4" />
        </IconButton>
        <p className="font-medium text-ink">
          {dayLabel(days[0] ?? anchor)} – {dayLabel(days[6] ?? anchor)}
          {week !== undefined && <span className="ml-2 font-normal text-ink-muted">Week {week}</span>}
        </p>
        {!isThisWeek && (
          <Button size="sm" variant="ghost" onClick={() => onAnchorChange(today)}>
            This week
          </Button>
        )}
      </div>
      <div className={cn('grid gap-3', COLUMNS[shown.length])}>
        {shown.map(({ day, classes: dayClasses, dates: dayDates }) => {
          const weekday = WEEKDAYS[isoWeekday(day) - 1];
          const isToday = day === today;
          return (
            <section key={day} aria-label={`${weekday?.label} ${dayLabel(day)}`} className={cn('flex min-w-0 flex-col gap-2 rounded-md border p-2', isToday ? 'border-print' : 'border-rule')}>
              <h3 className="flex items-baseline justify-between gap-2 px-0.5 text-sm">
                <span className="font-semibold text-ink">{weekday?.short}</span>
                <span className={cn('tabular text-xs', isToday ? 'font-medium text-print-strong' : 'text-ink-muted')}>{isToday ? 'Today' : dayLabel(day)}</span>
              </h3>
              {dayDates.map((entry) => (
                <DateItem key={entry.id} entry={entry} onSelect={() => onEditDate(entry)} />
              ))}
              {dayClasses.map((entry) => (
                <ClassItem key={entry.id} entry={entry} clashing={clashing.has(entry.id)} onSelect={() => onEditClass(entry)} />
              ))}
              {dayClasses.length === 0 && dayDates.length === 0 && <p className="px-0.5 text-xs text-ink-faint">Nothing scheduled</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
