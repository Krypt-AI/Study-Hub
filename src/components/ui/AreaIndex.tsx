/**
 * The first step of a browse page: its areas as large ruled rows, like the contents page of a test
 * booklet. Choosing one opens only that area, so the learner never scrolls past areas they don't study.
 */
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export interface AreaEntry {
  id: string;
  title: string;
  description: string;
  /** e.g. "6 subjects"; shown at the row's end. */
  count?: string;
  /** Something the learner has going on here, e.g. "2 in your plan"; shown in print ink. */
  note?: ReactNode;
  to: string;
}

export function AreaIndex({ label, entries, twoColumns = false }: { label: string; entries: AreaEntry[]; twoColumns?: boolean }) {
  return (
    <nav aria-label={label}>
      <ul className={cn('overflow-hidden rounded-md border border-rule bg-sheet', twoColumns && 'lg:grid lg:grid-cols-2')}>
        {entries.map((entry, index) => (
          <li key={entry.id} className={cn('border-rule', index > 0 && 'border-t', twoColumns && 'lg:odd:border-r', twoColumns && index === 1 && 'lg:border-t-0')}>
            <Link
              to={entry.to}
              className="group grid min-h-24 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-4 transition-colors duration-150 hover:bg-sheet-2 focus-visible:bg-sheet-2"
            >
              <span className="min-w-0">
                <span className="block font-display text-[1.625rem] leading-tight font-semibold text-ink group-hover:text-print-strong">{entry.title}</span>
                <span className="mt-1 block text-sm text-ink-muted">{entry.description}</span>
                {entry.note && <span className="mt-1.5 block text-sm font-medium text-print-strong">{entry.note}</span>}
              </span>
              <span className="flex items-center gap-2 text-ink-muted">
                {entry.count && <span className="tabular text-sm whitespace-nowrap">{entry.count}</span>}
                <ChevronRight className="size-5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** The heading row of an opened area: a way back to the index, then the area's title. */
export function AreaBack({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
      <ChevronRight className="size-4 rotate-180" aria-hidden />
      {label}
    </Link>
  );
}
