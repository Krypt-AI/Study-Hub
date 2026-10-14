/** Due reviews per subject, each a link that starts that subject's review session. */
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { Tag } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import type { CourseSummary } from '@/domain/content/types';
import type { DueCount } from '@/domain/learning/due';
import { practiceUrl } from './practiceModes';

export interface DueReviewsSheetProps {
  due: Array<DueCount & { course: CourseSummary | undefined }>;
  total: number;
}

export function DueReviewsSheet({ due, total }: DueReviewsSheetProps) {
  return (
    <Sheet title="Due today" aside={total > 0 ? <span className="display-numerals text-lg text-ink">{total}</span> : undefined} padded={due.length === 0}>
      {due.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing is due. Questions you answer in lessons come back here when it is time to review them.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {due.map((entry) => (
            <li key={entry.courseId}>
              <Link to={practiceUrl('review', { course: entry.courseId })} className="group flex items-center gap-3 px-4 py-3 hover:bg-sheet-2">
                <span className="min-w-0 flex-1 truncate font-medium group-hover:text-print-strong">{entry.course?.title ?? 'Other'}</span>
                {entry.overdue > 0 && <Tag tone="wrong">{entry.overdue} overdue</Tag>}
                <span className="tabular text-sm text-ink-muted">{entry.due} to review</span>
                <ChevronRight className="size-4 text-ink-faint" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
