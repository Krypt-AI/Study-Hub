/** A class or an important date as a compact, clickable row (opens its editor). */
import { MapPin, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ImportantDateRecord, TimetableClassRecord } from '@/data/records';
import { CLASS_KIND_LABELS, IMPORTANT_KIND_LABELS, timeRangeLabel } from '@/domain/calendar/calendar';
import { cn } from '@/lib/cn';
import { ImportantDateTag } from './ImportantDateTag';

const ROW = 'flex w-full min-w-0 flex-col gap-0.5 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors duration-150';

/** A button when the row opens an editor, otherwise plain text. */
function Row({ onSelect, className, children }: { onSelect?: () => void; className: string; children: ReactNode }) {
  return onSelect ? (
    <button type="button" onClick={onSelect} className={cn(ROW, className)}>
      {children}
    </button>
  ) : (
    <div className={cn(ROW, className)}>{children}</div>
  );
}

export function ClassItem({ entry, clashing, onSelect }: { entry: TimetableClassRecord; clashing?: boolean; onSelect?: () => void }) {
  return (
    <Row onSelect={onSelect} className={cn('border-rule bg-sheet-2', onSelect && 'hover:border-print-line')}>
      <span className="tabular text-xs text-ink-muted">
        {timeRangeLabel(entry.start, entry.end)} · {CLASS_KIND_LABELS[entry.kind]}
      </span>
      <span className="line-clamp-2 font-medium break-words text-ink">{entry.title}</span>
      {entry.location && (
        <span className="flex items-center gap-1 truncate text-xs text-ink-faint">
          <MapPin className="size-3 shrink-0" aria-hidden />
          {entry.location}
        </span>
      )}
      {clashing && (
        <span className="flex items-center gap-1 text-xs text-slip">
          <TriangleAlert className="size-3 shrink-0" aria-hidden />
          Overlaps another class
        </span>
      )}
    </Row>
  );
}

export function DateItem({ entry, onSelect, aside }: { entry: ImportantDateRecord; onSelect?: () => void; aside?: string }) {
  return (
    <Row onSelect={onSelect} className={cn('border-print-line bg-print-soft', onSelect && 'hover:border-print')}>
      <span className="flex flex-wrap items-center gap-1.5">
        <ImportantDateTag kind={entry.kind} />
        {entry.start && <span className="tabular text-xs text-ink-muted">{timeRangeLabel(entry.start, entry.end)}</span>}
        {aside && <span className="ml-auto text-xs text-ink-muted">{aside}</span>}
      </span>
      {/* A date named only by its kind already shows that name on its tag. */}
      {entry.title !== IMPORTANT_KIND_LABELS[entry.kind] && <span className="line-clamp-2 font-medium break-words text-ink">{entry.title}</span>}
      {entry.location && (
        <span className="flex items-center gap-1 truncate text-xs text-ink-faint">
          <MapPin className="size-3 shrink-0" aria-hidden />
          {entry.location}
        </span>
      )}
    </Row>
  );
}
