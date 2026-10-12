/** Due reviews per course, with the button that starts a review session. */
import { Target } from 'lucide-react';
import { BubbleStrip } from '@/components/ui/Bubble';
import { ButtonLink } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import type { CourseSummary } from '@/domain/content/types';
import type { DueCount } from '@/domain/learning/due';
import { relativeTime } from '@/lib/dates';
import { practiceUrl } from './practiceModes';

export interface DueReviewsSheetProps {
  due: Array<DueCount & { course: CourseSummary | undefined }>;
  total: number;
  title?: string;
  /** When nothing is due: when the next review falls due. */
  nextDue?: string;
}

export function DueReviewsSheet({ due, total, title = 'Due today', nextDue }: DueReviewsSheetProps) {
  return (
    <Sheet title={title} aside={total > 0 ? <span className="display-numerals text-lg text-ink">{total}</span> : undefined}>
      {due.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nothing is due. Questions you answer in lessons come back here when it is time to review them.
          {nextDue && <> The next review is due {relativeTime(nextDue)}.</>}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <ol className="flex flex-col">
            {due.map((entry, index) => (
              <li key={entry.courseId} className="flex items-center gap-3 border-b border-rule py-2 last:border-b-0">
                <span className="display-numerals w-5 text-right text-print">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate">{entry.course?.title ?? 'Other'}</span>
                <span className="hidden sm:flex">
                  <BubbleStrip states={Array.from({ length: Math.min(entry.due, 8) }, () => 'review' as const)} />
                </span>
                <span className="tabular w-8 text-right font-medium">{entry.due}</span>
                {entry.overdue > 0 && <Tag tone="wrong">{entry.overdue} overdue</Tag>}
              </li>
            ))}
          </ol>
          <ButtonLink to={practiceUrl('review')} variant="primary" icon={<Target className="size-4" />} className="self-start">
            Start review
          </ButtonLink>
        </div>
      )}
    </Sheet>
  );
}
