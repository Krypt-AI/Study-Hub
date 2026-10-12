/** Multi-line answers: explanations (with a word count) and translations. Ctrl/Cmd+Enter submits. */
import type { LongQuestion, TranslationQuestion } from '@/domain/content/types';
import { countWords } from '@/domain/evaluation/normalize';

const LANG_ATTR = { zh: 'zh-CN', ja: 'ja', en: 'en' } as const;

export interface TextAnswerInputProps {
  question: LongQuestion | TranslationQuestion;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function TextAnswerInput({ question, value, onChange, onSubmit, disabled = false }: TextAnswerInputProps) {
  const isLong = question.type === 'long';
  const minWords = question.type === 'long' ? question.minWords : undefined;
  const language = question.type === 'translation' ? question.to : question.language;
  const words = countWords(value);
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
        lang={language ? LANG_ATTR[language] : undefined}
        rows={isLong ? 7 : 3}
        aria-label="Your answer"
        placeholder={isLong ? 'Explain in your own words…' : 'Your translation…'}
        className="w-full resize-y rounded-md border border-rule-strong bg-sheet px-3.5 py-3 text-base leading-relaxed text-ink placeholder:text-ink-faint focus:border-print focus:outline-none disabled:opacity-100"
      />
      <p className="flex justify-between gap-3 text-sm text-ink-faint">
        <span>{question.answerHint ?? 'Ctrl + Enter to check'}</span>
        {isLong && (
          <span className="tabular" aria-live="polite">
            {words}
            {minWords ? ` / ${minWords}` : ''} words
          </span>
        )}
      </p>
    </div>
  );
}
