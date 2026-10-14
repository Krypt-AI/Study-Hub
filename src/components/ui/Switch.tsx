/** An on/off switch with a visible label and an optional description. */
import { useId } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  /** Show only the switch (the label stays its accessible name), for lists that already name each row. */
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, description, hideLabel = false, disabled = false, className }: SwitchProps) {
  const descriptionId = useId();
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className={cn('flex min-w-0 flex-col', hideLabel && 'sr-only')}>
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && (
          <span id={descriptionId} className="text-xs text-ink-muted">
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-print',
          checked ? 'border-print bg-print' : 'border-rule-strong bg-sheet-2',
        )}
      >
        <span className={cn('inline-block size-4 rounded-full bg-sheet shadow transition-transform duration-150', checked ? 'translate-x-5' : 'translate-x-1')} />
      </button>
    </label>
  );
}
