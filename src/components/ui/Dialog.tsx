/**
 * Modal dialog built on the native <dialog> element: focus trapping, Escape to close and
 * an inert page behind it come from the browser. Use only for tasks that need protected focus.
 */
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Hide the visible title (it stays as the accessible name). */
  hideTitle?: boolean;
}

export function Dialog({ open, onClose, title, children, footer, className, hideTitle = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose(); // backdrop click
      }}
      aria-labelledby={titleId}
      className={cn(
        'm-auto w-[min(36rem,calc(100vw-2rem))] rounded-md border border-rule-strong bg-sheet p-0 text-ink shadow-sheet backdrop:bg-black/50',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[80dvh] flex-col">
          <header className={cn('flex items-center justify-between gap-3 border-b border-print-line px-4 py-2.5', hideTitle && 'sr-only')}>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <IconButton label="Close" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t border-rule px-4 py-3">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
