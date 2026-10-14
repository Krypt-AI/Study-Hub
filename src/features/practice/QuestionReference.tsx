/**
 * "See the example": what a question refers to (an example from the lesson, a table, a page), opened
 * on request beside the question so the learner does not have to leave it to look it up.
 */
import { BookOpenText, ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { MediaList } from '@/components/media/MediaList';
import { Markdown } from '@/components/Markdown';
import type { Question } from '@/domain/content/types';
import { cn } from '@/lib/cn';

export function QuestionReference({ reference }: { reference: NonNullable<Question['reference']> }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-print-line px-2.5 py-1 text-sm text-print-strong transition-colors duration-150 hover:bg-print-soft"
      >
        <BookOpenText className="size-4" aria-hidden />
        {reference.label ?? 'See the example'}
        <ChevronDown className={cn('size-4 transition-transform duration-150', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={panelId} role="region" aria-label={reference.label ?? 'The example'} className="rounded-md border border-rule bg-sheet-2 px-4 py-3">
          {reference.excerpt && <Markdown compact>{reference.excerpt}</Markdown>}
          {reference.image && <MediaList media={[reference.image]} />}
        </div>
      )}
    </div>
  );
}
