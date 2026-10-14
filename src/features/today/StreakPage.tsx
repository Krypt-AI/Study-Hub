/**
 * /streak: the learner's days in a row, their longest run, whether today counts yet, and the last
 * twelve weeks as a sheet of bubbles (one per day: empty, some study, or the daily goal met).
 */
import { Link } from 'react-router';
import { Bubble, type BubbleState } from '@/components/ui/Bubble';
import { ErrorState, LoadingState } from '@/components/ui/Feedback';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useActivityDays, useSettings } from '@/data/queries';
import { type ActivityLevel, activityWeeks, type CalendarDayActivity, computeStreak } from '@/domain/learning/activity';
import { parseDayKey } from '@/lib/dates';

const LEVEL_BUBBLES: Record<ActivityLevel, BubbleState> = { none: 'empty', some: 'learning', goal: 'filled' };
const LEVEL_LABELS: Record<ActivityLevel, string> = { none: 'No study', some: 'Some study', goal: 'Daily goal met' };
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const days = (count: number) => `${count} day${count === 1 ? '' : 's'}`;

export default function StreakPage() {
  const activity = useActivityDays();
  const settings = useSettings();
  const error = activity.error ?? settings.error;
  if (error) return <ErrorState title="Your streak could not be loaded" error={error} />;
  if (!activity.data || !settings.data) return <LoadingState />;

  const streak = computeStreak(activity.data);
  const weeks = activityWeeks(activity.data, settings.data);

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
        <Link to="/" className="hover:text-ink">
          Today
        </Link>
      </nav>
      <PageHeader
        title="Your streak"
        lead={streak.activeToday ? 'Today counts already. Well done!' : 'Today does not count yet: answer a question or study for a minute to keep your streak going.'}
      />
      <div className="flex flex-col gap-6">
        <Sheet title="Days in a row" padded={false}>
          <dl className="grid grid-cols-3 divide-x divide-rule text-center">
            <Figure label="Now" value={days(streak.current)} />
            <Figure label="Longest" value={days(streak.longest)} />
            <Figure label="Today" value={streak.activeToday ? 'Done' : 'Not yet'} />
          </dl>
        </Sheet>
        <Sheet title="The last 12 weeks">
          <WeeksGrid weeks={weeks} />
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted" aria-label="Key">
            {(Object.keys(LEVEL_BUBBLES) as ActivityLevel[]).map((level) => (
              <li key={level} className="flex items-center gap-2">
                <Bubble state={LEVEL_BUBBLES[level]} size="sm" />
                {LEVEL_LABELS[level]}
              </li>
            ))}
          </ul>
        </Sheet>
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse gap-1 px-3 py-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="display-numerals text-2xl text-ink">{value}</dd>
    </div>
  );
}

const describe = (entry: CalendarDayActivity) =>
  `${parseDayKey(entry.day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}: ${entry.level === 'none' ? 'no study' : `${entry.minutes} min, ${entry.answers} answers${entry.level === 'goal' ? ', goal met' : ''}`}`;

/** Weekdays down the side, weeks across, oldest first: each day a bubble. */
function WeeksGrid({ weeks }: { weeks: CalendarDayActivity[][] }) {
  return (
    <table className="mx-auto border-separate border-spacing-1">
      <caption className="sr-only">Study on each day of the last 12 weeks</caption>
      <tbody>
        {WEEKDAYS.map((weekday, row) => (
          <tr key={weekday}>
            <th scope="row" className="pr-2 text-right text-xs font-normal text-ink-faint">
              {row % 2 === 0 ? weekday : <span className="sr-only">{weekday}</span>}
            </th>
            {weeks.map((week) => {
              const entry = week[row];
              if (!entry) return null;
              return (
                <td key={entry.day} className="p-0">
                  {entry.future ? (
                    <span className="block h-[11px] w-4" aria-hidden />
                  ) : (
                    <>
                      <Bubble state={LEVEL_BUBBLES[entry.level]} size="sm" title={describe(entry)} />
                      <span className="sr-only">{describe(entry)}</span>
                    </>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
