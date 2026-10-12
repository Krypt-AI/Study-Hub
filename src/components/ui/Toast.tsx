/** Lightweight toasts for confirmations ("Backup restored", "Exported"). */
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { ToastContext, type ToastTone as Tone } from './useToast';

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: Tone = 'info') => {
    const id = nextId++;
    setItems((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3200);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto rounded-md border bg-sheet px-3.5 py-2 text-sm shadow-sheet',
              item.tone === 'error' ? 'border-wrong/50 text-wrong' : item.tone === 'success' ? 'border-correct/50 text-ink' : 'border-rule-strong text-ink',
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
