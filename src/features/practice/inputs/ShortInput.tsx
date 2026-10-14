/**
 * Single-line typed answer. Enter submits, except while an input method (Chinese or Japanese
 * IME) is composing. Pinyin answers show tone numbers as marks while typing; kana answers
 * show romaji converted to kana.
 */
import { forwardRef } from 'react';
import { isRomaji, toHiragana } from 'wanakana';
import type { ShortQuestion } from '@/domain/content/types';
import { toMarkedPinyin } from '@/domain/evaluation/pinyin';
import { cn } from '@/lib/cn';
import { LANGUAGE_TAGS } from '@/domain/content/language';

export interface ShortInputProps {
  question: ShortQuestion;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  verdictTone?: 'correct' | 'wrong' | 'slip';
}


function preview(question: ShortQuestion, value: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;
  if (question.match.mode === 'pinyin' && /[1-5]/u.test(text)) {
    const marked = toMarkedPinyin(text);
    return marked && marked !== text ? marked : undefined;
  }
  if (question.match.mode === 'kana' && isRomaji(text)) {
    const kana = toHiragana(text);
    return kana !== text ? kana : undefined;
  }
  return undefined;
}

export const ShortInput = forwardRef<HTMLInputElement, ShortInputProps>(function ShortInput({ question, value, onChange, onSubmit, disabled = false, verdictTone }, ref) {
  const hint = preview(question, value);
  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onSubmit();
          }
        }}
        disabled={disabled}
        lang={question.language ? LANGUAGE_TAGS[question.language] : undefined}
        aria-label="Your answer"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Type your answer"
        className={cn(
          'h-12 w-full rounded-md border-b-2 border-x border-t bg-sheet px-3.5 text-lg text-ink placeholder:text-ink-faint',
          'border-x-rule border-t-rule border-b-print-line transition-colors focus:border-b-print focus:outline-none',
          'disabled:opacity-100',
          verdictTone === 'correct' && 'border-b-correct bg-correct-soft',
          verdictTone === 'wrong' && 'border-b-wrong bg-wrong-soft',
          verdictTone === 'slip' && 'border-b-slip bg-slip-soft',
        )}
      />
      <p className="min-h-5 text-sm text-ink-faint" aria-live="polite">
        {hint ? (
          <>
            Reads as <span className="font-medium text-ink">{hint}</span>
          </>
        ) : (
          question.answerHint
        )}
      </p>
    </div>
  );
});
