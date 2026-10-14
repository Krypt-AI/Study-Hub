/**
 * Today's classes and dates, each linked to its subject, and the important dates of the next weeks,
 * from the (optional) calendar. Classes come from the semester in effect today (the calendar's
 * default semester), so an old timetable never shows.
 */
import { Link } from 'react-router';
import { Sheet } from '@/components/ui/Sheet';
import { useImportantDates, useTimetableClasses } from '@/data/queries';
import { classesOn, datesOn, upcomingDates } from '@/domain/calendar/calendar';
import { defaultTerm } from '@/domain/calendar/semesters';
import { useCatalog } from '@/domain/content/load';
import { courseUrl } from '@/domain/content/urls';
import { useTerms } from '@/features/semesters/useTerms';
import { addDays, dayKey, relativeDay } from '@/lib/dates';
import { ClassItem, DateItem } from './AgendaItems';

/** How far ahead important dates are listed. */
const HORIZON_DAYS = 21;
const DATES_SHOWN = 4;

export function ComingUpSheet() {
  const today = dayKey();
  const terms = useTerms();
  const classes = useTimetableClasses();
  const dates = useImportantDates();
  const catalog = useCatalog();
  if (terms.isLoading || !classes.data || !dates.data) return null;

  const term = defaultTerm(terms.terms, terms.currentTerm, today);
  const semesters = terms.terms.flatMap((entry) => (entry.semester ? [entry.semester] : []));
  const todaysClasses = classesOn(today, classes.data.filter((entry) => entry.term === term), semesters);
  const todaysDates = datesOn(today, dates.data);
  const soon = upcomingDates(dates.data, addDays(today, 1), HORIZON_DAYS - 1);
  const unused = classes.data.length === 0 && dates.data.length === 0;
  const courseTitle = (courseId?: string) => catalog.data?.courses.find((course) => course.id === courseId)?.title;

  /** "Open Statistics for Computer Science", when the class or date is linked to a subject. */
  const subjectLink = (courseId?: string) => {
    const title = courseTitle(courseId);
    return courseId && title ? (
      <Link to={courseUrl(courseId)} className="self-start text-xs text-print-strong hover:underline">
        Open {title}
      </Link>
    ) : undefined;
  };

  return (
    <Sheet title="Today’s classes" aside={<Link to="/calendar" className="hover:text-ink">Calendar</Link>}>
      {unused ? (
        <p className="text-sm text-ink-muted">
          Optional: add your timetable and the dates of quizzes, tests and exams in the{' '}
          <Link to="/calendar" className="text-print-strong hover:underline">
            calendar
          </Link>
          , and link each class to its subject: today’s classes then appear here, ready to study.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <section aria-label="Today" className="flex flex-col gap-2">
            {todaysClasses.length === 0 && todaysDates.length === 0 ? (
              <p className="text-sm text-ink-faint">Nothing on the calendar today.</p>
            ) : (
              <>
                {todaysDates.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-1">
                    <DateItem entry={entry} />
                    {subjectLink(entry.courseId)}
                  </div>
                ))}
                {todaysClasses.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-1">
                    <ClassItem entry={entry} />
                    {subjectLink(entry.courseId)}
                  </div>
                ))}
              </>
            )}
          </section>
          <section aria-label="Important dates" className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink-muted">Coming up</h3>
            {soon.length === 0 ? (
              <p className="text-sm text-ink-faint">No quizzes, tests or exams in the next three weeks.</p>
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
