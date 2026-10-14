/**
 * Marking a written answer the way a teacher does with a marking scheme: for each part (content,
 * language, ...) the learner reads the bands as the scheme prints them and gives one mark.
 */
import { useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { Button } from '@/components/ui/Button';
import type { AnswerLanguage, LongQuestion } from '@/domain/content/types';
import { cn } from '@/lib/cn';
import { paperWords } from './paperWords';

type Part = LongQuestion['marking'][number];

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, index) => max - index);
const partMax = (part: Part) => Math.max(...part.bands.map((band) => band.max));

export function SchemeMarking({ marking, language, onConfirm }: { marking: Part[]; language?: AnswerLanguage; onConfirm: (score: number) => void }) {
  const words = paperWords(language);
  const [given, setGiven] = useState<Record<string, number>>({});
  const max = marking.reduce((sum, part) => sum + partMax(part), 0);
  const total = marking.reduce((sum, part) => sum + (given[part.title] ?? 0), 0);
  const complete = marking.every((part) => given[part.title] !== undefined);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-print-line bg-print-soft px-4 py-3" lang={language}>
      <p className="text-sm font-medium">{words.markWithScheme}</p>
      {marking.map((part) => (
        <fieldset key={part.title} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">
            {part.title} <span className="font-normal text-ink-muted">({words.marks(partMax(part))})</span>
          </legend>
          <ol className="flex flex-col divide-y divide-rule rounded-md border border-rule bg-sheet">
            {part.bands.map((band) => (
              <li key={`${band.min}-${band.max}`} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1 text-sm">
                  {band.name && <p className="font-medium">{band.name}</p>}
                  {band.description && <Markdown compact className="text-ink-muted">{band.description}</Markdown>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1" role="group" aria-label={`${part.title}: ${band.name ?? words.marks(band.max)}`}>
                  {range(band.min, band.max).map((mark) => (
                    <button
                      key={mark}
                      type="button"
                      aria-pressed={given[part.title] === mark}
                      onClick={() => setGiven((current) => ({ ...current, [part.title]: mark }))}
                      className={cn(
                        'tabular h-8 min-w-8 rounded border px-2 text-sm transition-colors duration-150',
                        given[part.title] === mark ? 'border-print bg-print text-on-print' : 'border-rule-strong hover:border-print-line',
                      )}
                    >
                      {mark}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </fieldset>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" disabled={!complete} onClick={() => onConfirm(max ? total / max : 0)}>
          {words.confirmMark}
        </Button>
        <span className="tabular text-sm text-ink-muted">
          {words.total}: {total} / {max}
        </span>
      </div>
    </div>
  );
}
