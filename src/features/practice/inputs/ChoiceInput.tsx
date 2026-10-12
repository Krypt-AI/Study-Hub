/** Multiple choice as answer-sheet rows: number, bubble, option. Keys 1-9 pick an option. */
import { type KeyboardEvent, useMemo } from 'react';
import { Markdown } from '@/components/Markdown';
import { Bubble, type BubbleState } from '@/components/ui/Bubble';
import { isNumberedChoice } from '@/domain/content/questions';
import type { ChoiceQuestion } from '@/domain/content/types';
import type { Feedback } from '@/domain/evaluation/types';
import { cn } from '@/lib/cn';

export interface ChoiceInputProps {
  question: ChoiceQuestion;
  selected: string[];
  onChange: (selected: string[]) => void;
  feedback?: Feedback;
  disabled?: boolean;
}

/** Fisher-Yates shuffle, so an option's position never gives the answer away. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap] as T, copy[index] as T];
  }
  return copy;
}

export function ChoiceInput({ question, selected, onChange, feedback, disabled = false }: ChoiceInputProps) {
  // Shuffle once per question, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => (question.shuffle ? shuffled(question.options) : question.options), [question.id]);
  const correct = new Set(question.correct);
  const imageOnly = isNumberedChoice(question);

  const toggle = (id: string) => {
    if (disabled) return;
    if (question.multiple) onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
    else onChange([id]);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const position = Number(event.key) - 1;
    const option = options[position];
    if (option && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      toggle(option.id);
    }
  };

  const bubbleFor = (id: string): BubbleState => {
    const chosen = selected.includes(id);
    if (!feedback) return chosen ? 'filled' : 'empty';
    if (correct.has(id)) return chosen ? 'correct' : 'review';
    return chosen ? 'wrong' : 'empty';
  };

  return (
    <div
      role={question.multiple ? 'group' : 'radiogroup'}
      aria-label={question.multiple ? 'Choose all that apply' : 'Choose one answer'}
      onKeyDown={onKeyDown}
      className={cn('flex', imageOnly ? 'flex-row flex-wrap gap-2' : 'flex-col divide-y divide-rule rounded-md border border-rule')}
    >
      {options.map((option, position) => {
        const chosen = selected.includes(option.id);
        const state = bubbleFor(option.id);
        return (
          <button
            key={option.id}
            type="button"
            role={question.multiple ? 'checkbox' : 'radio'}
            aria-checked={chosen}
            aria-disabled={disabled || undefined}
            tabIndex={!question.multiple && selected.length > 0 && !chosen ? -1 : 0}
            onClick={() => toggle(option.id)}
            className={cn(
              'flex items-center gap-3 text-left transition-colors duration-150',
              imageOnly ? 'h-11 min-w-16 justify-center rounded-md border px-3' : 'min-h-11 px-3 py-2',
              imageOnly && (chosen ? 'border-print bg-print-soft' : 'border-rule-strong hover:border-print-line'),
              !imageOnly && (chosen ? 'bg-print-soft' : 'hover:bg-sheet-2'),
              feedback && correct.has(option.id) && 'bg-correct-soft',
              disabled && 'cursor-default',
            )}
          >
            {!imageOnly && <span className="display-numerals w-4 shrink-0 text-right text-sm text-print">{position + 1}</span>}
            <Bubble state={state} size="md" animate={Boolean(feedback) && chosen} />
            {imageOnly ? (
              <span className="display-numerals text-lg">{option.text}</span>
            ) : (
              <Markdown compact className="min-w-0 flex-1">
                {option.text}
              </Markdown>
            )}
          </button>
        );
      })}
    </div>
  );
}
