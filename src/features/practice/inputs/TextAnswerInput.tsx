/** Multi-line answers: explanations (with a word count) and translations. Ctrl/Cmd+Enter submits. */
import type { LongQuestion, TranslationQuestion } from '@/domain/content/types';
import { countWords } from '@/domain/evaluation/normalize';
import { LANGUAGE_TAGS } from '@/domain/content/language';
import { cn } from '@/lib/cn';
import { paperWords } from '../paperWords';

export interface TextAnswerInputProps {
  question: LongQuestion | TranslationQuestion;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function TextAnswerInput({ question, value, onChange, onSubmit, disabled = false }: TextAnswerInputProps) {
  const isLong = question.type === 'long';
  const limit = question.type === 'long' ? { min: question.minWords, max: question.maxWords } : {};
  const language = question.type === 'translation' ? question.to : question.language;
  const words = countWords(value);
  const over = limit.max !== undefined && words > limit.max;
  const text = paperWords(language);
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onSubmit();
          }
        }}
        disabled={disabled}
        lang={language ? LANGUAGE_TAGS[language] : undefined}
        rows={isLong ? 7 : 3}
        aria-label="Your answer"
        placeholder={isLong ? text.answerPlaceholder : 'Your translation…'}
        className="w-full resize-y rounded-md border border-rule-strong bg-sheet px-3.5 py-3 text-base leading-relaxed text-ink placeholder:text-ink-faint focus:border-print focus:outline-none disabled:opacity-100"
      />
      <p className="flex justify-between gap-3 text-sm text-ink-faint">
        <span>{question.answerHint ?? text.submitHint}</span>
        {isLong && (
          <span className={cn('tabular', over && 'font-medium text-wrong')} aria-live="polite">
            {text.wordCount(words, limit)}
            {over && `: ${text.overLimit}`}
          </span>
        )}
      </p>
    </div>
  );
}
