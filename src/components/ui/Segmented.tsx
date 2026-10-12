/** A compact set of mutually exclusive toggle buttons, e.g. "Missed | All". */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: ReactNode }>;
  label: string;
  className?: string;
}

export function Segmented<T extends string>({ value, onChange, options, label, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex rounded-md border border-rule-strong p-0.5', className)}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.id)}
            className={cn(
              'h-7 rounded px-2.5 text-[0.8125rem] transition-colors duration-150',
              active ? 'bg-print-soft font-medium text-print-strong' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
