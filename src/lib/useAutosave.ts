/**
 * Debounced autosave with a visible status. Unsaved changes are flushed when the form
 * unmounts (switching records, leaving the page) so nothing typed is lost.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';

export interface Autosave {
  status: SaveStatus;
  savedAt?: Date;
  /** Save immediately (e.g. on blur or before navigating). */
  flush: () => Promise<void>;
  /** Drop unsaved changes so nothing is written later (e.g. the record is being deleted). */
  discard: () => void;
}

export function useAutosave<T>(value: T, save: (value: T) => Promise<unknown>, delay = 800): Autosave {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [savedAt, setSavedAt] = useState<Date>();
  const latest = useRef(value);
  const saveRef = useRef(save);
  const lastSaved = useRef(JSON.stringify(value));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // flush() runs outside render (timers, blur, unmount): keep the newest value and saver for it.
  useLayoutEffect(() => {
    latest.current = value;
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const snapshot = latest.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSaved.current) return;
    setStatus('saving');
    try {
      await saveRef.current(snapshot);
      lastSaved.current = serialized;
      setSavedAt(new Date());
      setStatus(JSON.stringify(latest.current) === serialized ? 'saved' : 'pending');
    } catch {
      setStatus('error');
    }
  }, []);

  const discard = useCallback(() => {
    clearTimeout(timer.current);
    lastSaved.current = JSON.stringify(latest.current);
    setStatus('saved');
  }, []);

  useEffect(() => {
    if (JSON.stringify(value) === lastSaved.current) return;
    setStatus('pending');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  }, [value, delay, flush]);

  useEffect(() => {
    const onUnload = () => void flush();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      void flush();
    };
  }, [flush]);

  return { status, savedAt, flush, discard };
}
