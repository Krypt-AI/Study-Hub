/**
 * One question at a time: prompt, original material, the answer input, hints, and the
 * actions to check, retry, reveal and move on. Feedback appears in place.
 */
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Lightbulb, RotateCcw } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { MediaList } from '@/components/media/MediaList';
import { Markdown } from '@/components/Markdown';
import { SourceBadge } from '@/components/SourceBadge';
import { Button, IconButton, Spinner } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Feedback';
import type { Question } from '@/domain/content/types';
import type { Feedback, Response } from '@/domain/evaluation/types';
import { SKILL_LABELS } from '@/domain/learning/mastery';
import type { ContentLang } from '@/domain/content/language';
import { FeedbackPanel } from './FeedbackPanel';
import { ChoiceInput } from './inputs/ChoiceInput';
import { ClozeInput } from './inputs/ClozeInput';
import { CodeAnswerInput } from './inputs/CodeAnswerInput';
import { ShortInput } from './inputs/ShortInput';
import { TextAnswerInput } from './inputs/TextAnswerInput';
import { hasAnswer } from './session/responses';
import type { PracticeSession } from './session/usePracticeSession';
import { useBookmark } from './useBookmark';
import { QuestionReference } from './QuestionReference';

export interface QuestionCardProps {
  session: PracticeSession;
  /** Language of the course content, for correct CJK glyphs in prompts. */
  contentLang?: ContentLang;
  /** Shown next to the counter, e.g. the lesson a review question comes from. */
  context?: ReactNode;
}

export function QuestionCard({ session, contentLang, context }: QuestionCardProps) {
  const { item, state, index, items } = session;
  const nextRef = useRef<HTMLButtonElement>(null);
  const bookmark = useBookmark(
    item
      ? { type: 'question', id: item.question.id, label: item.question.prompt.slice(0, 80), courseId: item.courseId, lessonId: item.lessonId }
      : undefined,
  );

  useEffect(() => {
    if (state?.feedback && !state.pendingSelfReview) nextRef.current?.focus();
  }, [state?.feedback, state?.pendingSelfReview]);

  if (!item || !state) return null;
  const { question } = item;
  const answered = Boolean(state.feedback);
  const locked = answered || state.running;
  const canSubmit = hasAnswer(state.draft) && !locked;
  const isLast = index === items.length - 1;
  const hintsLeft = question.hints.length - state.hintsUsed;

  return (
    <article className="flex flex-col gap-4" aria-labelledby={`question-${question.id}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 id={`question-${question.id}`} className="display-numerals text-lg font-semibold">
          Question {index + 1} <span className="font-normal text-ink-faint">/ {items.length}</span>
        </h3>
        <Tag>{SKILL_LABELS[question.skill]}</Tag>
        <SourceBadge source={question.source} compact />
        {context}
        <div className="ml-auto flex items-center gap-1">
          <IconButton label={bookmark.isBookmarked ? 'Remove from revision list' : 'Save for revision'} onClick={bookmark.toggle} aria-pressed={bookmark.isBookmarked}>
            {bookmark.isBookmarked ? <BookmarkCheck className="size-4 text-print" /> : <Bookmark className="size-4" />}
          </IconButton>
        </div>
      </header>

      <div lang={contentLang}>
        <Markdown className="text-[1.0625rem]">{question.prompt}</Markdown>
      </div>
      <MediaList media={question.media} />
      {question.reference && <QuestionReference reference={question.reference} />}

      <QuestionInput question={question} draft={state.draft} onChange={session.setDraft} onSubmit={() => void session.submit()} locked={locked} feedback={state.feedback} />

      {state.hintsUsed > 0 && (
        <ol className="flex flex-col gap-1.5 rounded-md border border-dashed border-print-line px-4 py-2.5">
          {question.hints.slice(0, state.hintsUsed).map((hint, hintIndex) => (
            <li key={hintIndex} className="flex gap-2 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-print" aria-hidden />
              <Markdown compact>{hint}</Markdown>
            </li>
          ))}
        </ol>
      )}

      {state.error && <p className="text-sm text-wrong">{state.error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {!answered && (
          <>
            <Button variant="primary" onClick={() => void session.submit()} disabled={!canSubmit} loading={state.running}>
              {question.type === 'code' || question.type === 'sql' ? 'Run and check' : 'Check answer'}
            </Button>
            {hintsLeft > 0 && (
              <Button variant="ghost" icon={<Lightbulb className="size-4" />} onClick={session.takeHint} disabled={state.running}>
                Hint ({hintsLeft} left)
              </Button>
            )}
            <Button variant="ghost" onClick={session.reveal} disabled={state.running}>
              Show answer
            </Button>
            {state.running && (
              <span className="flex items-center gap-2 text-sm text-ink-muted">
                <Spinner /> {state.runStatus ?? 'Running in the sandbox…'}
              </span>
            )}
          </>
        )}
        {answered && !state.pendingSelfReview && (
          <>
            {state.lastVerdict !== 'correct' && (
              <Button icon={<RotateCcw className="size-4" />} onClick={session.retry}>
                Try again
              </Button>
            )}
            {!isLast && (
              <Button ref={nextRef} variant="primary" icon={<ChevronRight className="size-4" />} onClick={session.next}>
                Next question
              </Button>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <IconButton label="Previous question" onClick={session.previous} disabled={index === 0}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton label="Next question" onClick={session.next} disabled={isLast}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>

      {state.feedback && (
        <FeedbackPanel
          question={question}
          feedback={state.feedback}
          run={state.run}
          pendingSelfReview={state.pendingSelfReview}
          onConfirmSelfReview={session.confirmSelfReview}
          onAcceptAsCorrect={session.acceptAsCorrect}
        />
      )}
    </article>
  );
}

export interface QuestionInputProps {
  question: Question;
  draft: Response;
  onChange: (draft: Response) => void;
  onSubmit: () => void;
  locked: boolean;
  feedback?: Feedback;
}

/** The answer control for any question type. */
export function QuestionInput({ question, draft, onChange, onSubmit, locked, feedback }: QuestionInputProps) {
  switch (question.type) {
    case 'choice':
      return (
        <ChoiceInput
          question={question}
          selected={draft.type === 'choice' ? draft.selected : []}
          onChange={(selected) => onChange({ type: 'choice', selected })}
          feedback={feedback}
          disabled={locked}
        />
      );
    case 'short':
      return (
        <ShortInput
          key={question.id}
          question={question}
          value={draft.type === 'short' ? draft.text : ''}
          onChange={(text) => onChange({ type: 'short', text })}
          onSubmit={onSubmit}
          disabled={locked}
          verdictTone={feedback ? (feedback.verdict === 'correct' ? 'correct' : feedback.verdict === 'almost' ? 'slip' : 'wrong') : undefined}
        />
      );
    case 'cloze':
      return (
        <ClozeInput
          question={question}
          values={draft.type === 'cloze' ? draft.blanks : {}}
          onChange={(blanks) => onChange({ type: 'cloze', blanks })}
          onSubmit={onSubmit}
          parts={feedback?.parts}
          disabled={locked}
        />
      );
    case 'long':
    case 'translation':
      return (
        <TextAnswerInput
          question={question}
          value={draft.type === 'long' || draft.type === 'translation' ? draft.text : ''}
          onChange={(text) => onChange(question.type === 'long' ? { type: 'long', text } : { type: 'translation', text })}
          onSubmit={onSubmit}
          disabled={locked}
        />
      );
    case 'code':
    case 'sql':
      return (
        <CodeAnswerInput
          question={question}
          code={draft.type === 'code' || draft.type === 'sql' ? draft.code : ''}
          onChange={(code) => onChange(question.type === 'sql' ? { type: 'sql', code } : { type: 'code', code })}
          onSubmit={onSubmit}
          disabled={locked}
        />
      );
  }
}
