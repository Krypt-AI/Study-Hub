/** The kind of an important date as a tag, toned by how much is at stake. */
import { Tag } from '@/components/ui/Feedback';
import type { ImportantDateKind } from '@/data/records';
import { importantKindShortLabel } from '@/domain/calendar/calendar';

const TONES: Record<ImportantDateKind, 'neutral' | 'print' | 'wrong' | 'slip'> = {
  quiz: 'slip',
  test: 'print',
  midterm: 'print',
  final: 'wrong',
  assignment: 'neutral',
  'extra-class': 'neutral',
  other: 'neutral',
};

export function ImportantDateTag({ kind, className }: { kind: ImportantDateKind; className?: string }) {
  return (
    <Tag tone={TONES[kind]} className={className}>
      {importantKindShortLabel(kind)}
    </Tag>
  );
}
