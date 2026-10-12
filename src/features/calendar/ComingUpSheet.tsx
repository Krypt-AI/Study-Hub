/** Today's classes and the important dates of the next weeks, from the (optional) calendar. */
import { Link } from 'react-router';
import { Sheet } from '@/components/ui/Sheet';
import { useImportantDates, useSemesters, useTimetableClasses } from '@/data/queries';
import { classesOn, upcomingDates } from '@/domain/calendar/calendar';
import { dayKey, relativeDay } from '@/lib/dates';
import { ClassItem, DateItem } from './AgendaItems';

/** How far ahead important dates are listed. */
const HORIZON_DAYS = 21;
const DATES_SHOWN = 4;

export function ComingUpSheet() {
  const today = dayKey();
  const semesters = useSemesters();
  const classes = useTimetableClasses();
  const dates = useImportantDates();
  if (!semesters.data || !classes.data || !dates.data) return null;

  const todaysClasses = classesOn(today, classes.data, semesters.data);
  const soon = upcomingDates(dates.data, today, HORIZON_DAYS);
  const unused = classes.data.length === 0 && dates.data.length === 0;

  return (
    <Sheet title="Coming up" aside={<Link to="/calendar" className="hover:text-ink">Calendar</Link>}>
      {unused ? (
        <p className="text-sm text-ink-muted">
          Optional: add your timetable and the dates of quizzes, tests and exams in the{' '}
          <Link to="/calendar" className="text-print-strong hover:underline">
            calendar
          </Link>{' '}
          to see them here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <section aria-label="Today's classes" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink-muted">Classes today</h3>
            {todaysClasses.length === 0 ? <p className="text-sm text-ink-faint">No classes today.</p> : todaysClasses.map((entry) => <ClassItem key={entry.id} entry={entry} />)}
          </section>
          <section aria-label="Important dates" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink-muted">Next {HORIZON_DAYS} days</h3>
            {soon.length === 0 ? (
              <p className="text-sm text-ink-faint">No quizzes, tests or exams.</p>
            ) : (
              soon.slice(0, DATES_SHOWN).map((entry) => <DateItem key={entry.id} entry={entry} aside={relativeDay(entry.date, today)} />)
            )}
            {soon.length > DATES_SHOWN && (
              <Link to="/calendar?view=dates" className="text-sm text-print-strong hover:underline">
                {soon.length - DATES_SHOWN} more
              </Link>
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}
