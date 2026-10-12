/** Loading, empty and error states, plus small tags. */
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button, Spinner } from './Button';

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center gap-2.5 py-10 text-sm text-ink-muted', className)}>
      <Spinner className="text-print" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children, action, className }: { title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-start gap-2 rounded-md border border-dashed border-rule-strong px-5 py-6', className)}>
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="max-w-[60ch] text-sm text-ink-muted">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }: { title?: string; error?: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-md border border-wrong/40 bg-wrong-soft px-5 py-4">
      <p className="flex items-center gap-2 font-medium text-wrong">
        <AlertTriangle className="size-4" aria-hidden /> {title}
      </p>
      {message && <p className="text-sm text-ink-muted">{message}</p>}
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

type TagTone = 'neutral' | 'print' | 'correct' | 'wrong' | 'slip';

const TAG_TONES: Record<TagTone, string> = {
  neutral: 'border-rule-strong text-ink-muted',
  print: 'border-print-line text-print-strong bg-print-soft',
  correct: 'border-correct/40 text-correct bg-correct-soft',
  wrong: 'border-wrong/40 text-wrong bg-wrong-soft',
  slip: 'border-slip/40 text-slip bg-slip-soft',
};

export function Tag({ tone = 'neutral', children, className, title }: { tone?: TagTone; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn('inline-flex h-5.5 items-center gap-1 rounded border px-1.5 text-xs leading-none font-medium whitespace-nowrap', TAG_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-rule-strong bg-sheet-2 px-1.5 py-0.5 font-code text-[0.6875rem] text-ink-muted">{children}</kbd>;
}
