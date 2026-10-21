/**
 * "In this lesson": the lesson's sections as jump links, closed until wanted so it never pushes the
 * reading down. A long lesson becomes a page you can move around in rather than a scroll you must endure.
 */
import { ListTree } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { LessonHeading } from '@/domain/content/headings';
import { cn } from '@/lib/cn';

/** Anchor of the lesson's practice sheet. */
export const PRACTICE_ANCHOR = 'practice';

/** Fewer sections than this need no outline: the lesson is short enough to scroll. */
const MIN_SECTIONS = 3;

export function LessonOutline({ headings, questionCount }: { headings: readonly LessonHeading[]; questionCount: number }) {
  const sections = headings.filter((heading) => heading.level === 2).length;
  if (sections < MIN_SECTIONS) return null;

  const jump = (id: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  return (
    <details className="group rounded-xl border border-rule bg-sheet">
      <summary className="flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 font-medium hover:bg-sheet-2">
        <ListTree className="size-4 text-ink-faint group-open:text-print" aria-hidden />
        In this lesson
        <span className="tabular text-sm font-normal text-ink-faint">{sections} sections</span>
      </summary>
      <nav aria-label="In this lesson" className="px-4 pb-4">
        <ol className="flex flex-col gap-0.5">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={jump(heading.id)}
                className={cn(
                  'block rounded-md py-1.5 text-ink-muted hover:bg-sheet-2 hover:text-ink',
                  heading.level === 2 ? 'px-2 font-medium' : 'pr-2 pl-6 text-sm',
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
          {questionCount > 0 && (
            <li>
              <a href={`#${PRACTICE_ANCHOR}`} onClick={jump(PRACTICE_ANCHOR)} className="mt-1 block rounded-md border-t border-rule px-2 py-1.5 pt-2.5 font-medium text-print-strong hover:bg-sheet-2">
                Practice · {questionCount} {questionCount === 1 ? 'question' : 'questions'}
              </a>
            </li>
          )}
        </ol>
      </nav>
    </details>
  );
}
