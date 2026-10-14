/** Fill-in-the-blanks: the text with an inline input for each [[n]] gap. */
import { Fragment, type ReactNode } from 'react';
import type { ClozeQuestion } from '@/domain/content/types';
import type { FeedbackPart } from '@/domain/evaluation/types';
import { cn } from '@/lib/cn';

export interface ClozeInputProps {
  question: ClozeQuestion;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onSubmit: () => void;
  parts?: FeedbackPart[];
  disabled?: boolean;
}

/** Inline `code` spans inside the cloze text. */
function renderText(text: string, key: string): ReactNode {
  return text.split(/(`[^`]+`)/u).map((piece, index) =>
    piece.startsWith('`') && piece.endsWith('`') ? (
      <code key={`${key}-${index}`} className="rounded border border-rule bg-sheet-2 px-1 font-code text-[0.875em]">
        {piece.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={`${key}-${index}`}>{piece}</Fragment>
    ),
  );
}

export function ClozeInput({ question, values, onChange, onSubmit, parts, disabled = false }: ClozeInputProps) {
  const segments = question.text.split(/\[\[([^\]]+)\]\]/u);
  return (
    <p className="whitespace-pre-line text-lg leading-[2.4]" lang={question.language === 'zh' ? 'zh-CN' : question.language}>
      {segments.map((segment, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{renderText(segment, String(index))}</Fragment>;
        const blankIndex = question.blanks.findIndex((blank) => blank.id === segment);
        const blank = question.blanks[blankIndex];
        const part = parts?.[blankIndex];
        const width = Math.max(4, ...(blank?.accepted ?? ['']).map((answer) => Array.from(answer).length)) + 2;
        return (
          <input
            key={index}
            value={values[segment] ?? ''}
            onChange={(event) => onChange({ ...values, [segment]: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                onSubmit();
              }
            }}
            disabled={disabled}
            aria-label={`Gap ${blankIndex + 1}`}
            autoComplete="off"
            spellCheck={false}
            style={{ width: `${width}ch` }}
            className={cn(
              'mx-1 inline-block h-9 rounded-sm border-b-2 bg-sheet px-2 text-center align-baseline text-base text-ink focus:outline-none',
              part ? (part.verdict === 'correct' ? 'border-correct bg-correct-soft' : part.verdict === 'almost' ? 'border-slip bg-slip-soft' : 'border-wrong bg-wrong-soft') : 'border-print-line focus:border-print',
            )}
          />
        );
      })}
    </p>
  );
}
