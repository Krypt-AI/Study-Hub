/** A delete button that asks again in place (the forms using it are already dialogs). */
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function ConfirmDeleteButton({ question, onConfirm, loading }: { question: string; onConfirm: () => void; loading?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button type="button" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2" role="group" aria-label={question}>
      <span className="text-sm text-ink-muted">{question}</span>
      <Button type="button" variant="danger" size="sm" onClick={onConfirm} loading={loading} autoFocus>
        Delete
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Keep
      </Button>
    </span>
  );
}
