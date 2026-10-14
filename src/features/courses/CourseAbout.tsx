/**
 * The course's description, cut to a few lines so the chapters start on the first screen. "More about
 * this course" shows the rest, with the note on how the material was made.
 */
import { useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { cn } from '@/lib/cn';

/** About three lines of text at the page's width; a shorter description is shown whole. */
const SHORT_DESCRIPTION = 240;

export function CourseAbout({ description, notice }: { description: string; notice?: string }) {
  const [open, setOpen] = useState(false);
  if (!notice && description.length <= SHORT_DESCRIPTION) return <Markdown className="max-w-[70ch]">{description}</Markdown>;
  return (
    <div className="flex max-w-[70ch] flex-col gap-3">
      <Markdown className={cn(!open && 'line-clamp-3')}>{description}</Markdown>
      {open && notice && (
        <aside className="rounded-md bg-print-soft px-4 py-3 text-sm">
          <Markdown compact>{notice}</Markdown>
        </aside>
      )}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="self-start text-sm text-ink-muted hover:text-ink">
        {open ? 'Show less' : 'More about this course'}
      </button>
    </div>
  );
}
