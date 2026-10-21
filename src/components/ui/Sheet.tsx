/**
 * A sheet: the basic panel, a softly rounded page. Its optional header is a heading in the
 * display face with its counts or links beside it; spacing, not a rule, separates it from the body.
 */
import { type HTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/lib/cn';

export interface SheetProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Right side of the header band: counts, links, actions. */
  aside?: ReactNode;
  as?: 'section' | 'div' | 'article' | 'aside';
  padded?: boolean;
  headingLevel?: 2 | 3;
}

export function Sheet({ title, aside, as: Element = 'section', padded = true, headingLevel = 2, className, children, ...rest }: SheetProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const headingId = useId();
  // A titled sheet is named by its heading, so it can be found as a region; an explicit aria-label wins.
  const labelledBy = title && !rest['aria-label'] ? headingId : undefined;
  return (
    <Element className={cn('rounded-xl border border-rule bg-sheet', className)} aria-labelledby={labelledBy} {...rest}>
      {(title || aside) && (
        <header className="flex min-h-12 items-center justify-between gap-3 px-5 pt-3">
          {title && (
            <Heading id={headingId} className="text-[1.0625rem] font-bold text-ink">
              {title}
            </Heading>
          )}
          {aside && <div className="flex items-center gap-2 text-sm text-ink-muted">{aside}</div>}
        </header>
      )}
      <div className={padded ? cn('px-5 pb-5', title || aside ? 'pt-2' : 'pt-5') : undefined}>{children}</div>
    </Element>
  );
}

/** Page title row: heading, optional lead text and actions. */
export function PageHeader({ title, lead, actions, children }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-tight font-bold text-ink sm:text-[2rem]">{title}</h1>
        {lead && <p className="mt-1.5 max-w-[68ch] text-ink-muted">{lead}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
