/**
 * Provenance of a piece of content, always visible: extracted from your book (with the
 * page and any review flags), written for Study Hub, or a third-party resource.
 */
import { BookOpenText, ExternalLink, PenLine } from 'lucide-react';
import { describeFlag, REASSURING_FLAGS } from '@/domain/content/flags';
import type { SourceRef } from '@/domain/content/types';
import { Tag } from './ui/Feedback';

export function SourceBadge({ source, compact = false }: { source: SourceRef; compact?: boolean }) {
  if (source.origin === 'authored') {
    return (
      <Tag title="Written for Study Hub">
        <PenLine className="size-3" aria-hidden /> Study Hub
      </Tag>
    );
  }
  if (source.origin === 'external') {
    return (
      <Tag title={source.url}>
        <ExternalLink className="size-3" aria-hidden /> {source.title ?? 'External'}
      </Tag>
    );
  }
  const warnings = source.flags.filter((flag) => !REASSURING_FLAGS.has(flag));
  const label = compact ? 'Your book' : `${source.title ?? 'Your book'}${source.page ? ` · p.${source.page}` : ''}`;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Tag tone="print" title={`Extracted from your materials${source.page ? `, PDF page ${source.page}` : ''}`}>
        <BookOpenText className="size-3" aria-hidden /> {label}
      </Tag>
      {warnings.length > 0 && (
        <Tag tone="slip" title={warnings.map(describeFlag).join('\n')}>
          check page
        </Tag>
      )}
    </span>
  );
}
