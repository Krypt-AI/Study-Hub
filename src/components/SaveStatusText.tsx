/** The status line of an autosaving form: "Saving…", "Unsaved changes", "Saved 10:42". */
import type { SaveStatus } from '@/lib/useAutosave';
import { cn } from '@/lib/cn';

export function SaveStatusText({ status, savedAt }: { status: SaveStatus; savedAt?: Date }) {
  const text =
    status === 'saving'
      ? 'Saving…'
      : status === 'pending'
        ? 'Unsaved changes'
        : status === 'error'
          ? 'Could not save. Keep this tab open and edit again to retry.'
          : savedAt
            ? `Saved ${savedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
            : 'Saved';
  return (
    <span role="status" className={cn('text-xs', status === 'error' ? 'text-wrong' : 'text-ink-faint')}>
      {text}
    </span>
  );
}
