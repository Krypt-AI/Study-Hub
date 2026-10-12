/**
 * What the learner sees after answering: the mark, specific feedback, the breakdown by gap
 * or test, the expected or model answer, the explanation, and how the answer was judged.
 * Self-reviewed answers end with the rubric checklist the learner confirms; typed answers
 * marked wrong by wording can be overruled ("I was right").
 */
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react';
import { useState } from 'react';
import { MediaList } from '@/components/media/MediaList';
import { Markdown } from '@/components/Markdown';
import { ResultTable } from '@/components/ResultTable';
import { Bubble } from '@/components/ui/Bubble';
import { Button } from '@/components/ui/Button';
import { isNumberedChoice } from '@/domain/content/questions';
import type { Question } from '@/domain/content/types';
import type { Feedback, FeedbackPoint } from '@/domain/evaluation/types';
import { cn } from '@/lib/cn';
import type { RunResponse } from '@/workers/protocol';
import { verdictBubble } from './session/usePracticeSession';

const POINT_ICON: Record<FeedbackPoint['tone'], typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
  error: XCircle,
};

const POINT_COLOR: Record<FeedbackPoint['tone'], string> = {
  success: 'text-correct',
  info: 'text-ink-faint',
  warning: 'text-slip',
  error: 'text-wrong',
};

export interface FeedbackPanelProps {
  question: Question;
  feedback: Feedback;
  run?: RunResponse;
  pendingSelfReview: boolean;
  onConfirmSelfReview: (score: number) => void;
  /** Lets the learner overrule a wording-based mark ("I was right"); omitted when not allowed. */
  onAcceptAsCorrect?: () => void;
}

export function FeedbackPanel({ question, feedback, run, pendingSelfReview, onConfirmSelfReview, onAcceptAsCorrect }: FeedbackPanelProps) {
  const imageOnlyChoice = isNumberedChoice(question);
  return (
    <section aria-live="polite" aria-label="Feedback" className="flex flex-col gap-4 border-t border-print-line pt-4">
      <header className="flex items-center gap-3">
        <Bubble state={pendingSelfReview ? 'current' : verdictBubble(feedback.verdict)} size="lg" animate />
        <h3 className={cn('text-xl font-semibold', feedback.verdict === 'correct' ? 'text-correct' : feedback.verdict === 'almost' ? 'text-slip' : feedback.verdict === 'self-review' ? 'text-ink' : 'text-wrong')}>
          {feedback.headline}
        </h3>
        {(feedback.verdict === 'partial' || feedback.verdict === 'self-review') && !pendingSelfReview && (
          <span className="tabular ml-auto text-sm text-ink-muted">{Math.round(feedback.score * 100)}%</span>
        )}
      </header>

      {feedback.points.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {feedback.points.map((point, index) => {
            const Icon = POINT_ICON[point.tone];
            return (
              <li key={index} className="flex gap-2 text-sm">
                <Icon className={cn('mt-0.5 size-4 shrink-0', POINT_COLOR[point.tone])} aria-hidden />
                <span className="whitespace-pre-wrap">{point.message}</span>
              </li>
            );
          })}
        </ul>
      )}

      {feedback.parts && feedback.parts.length > 0 && (
        <ol className="flex flex-col divide-y divide-rule rounded-md border border-rule">
          {feedback.parts.map((part, index) => (
            <li key={index} className="flex flex-col gap-1 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <Bubble state={verdictBubble(part.verdict)} size="sm" />
                <span className="font-medium">{part.label}</span>
                {part.expected !== undefined && part.verdict !== 'correct' && (
                  <span className="ml-auto text-ink-muted">
                    expected <span className="font-medium text-ink">{part.expected}</span>
                  </span>
                )}
              </span>
              {part.message && <pre className="overflow-x-auto font-code text-xs whitespace-pre-wrap text-ink-muted">{part.message}</pre>}
            </li>
          ))}
        </ol>
      )}

      {run && <RunOutput run={run} />}

      {pendingSelfReview && <SelfReview feedback={feedback} onConfirm={onConfirmSelfReview} />}

      {!pendingSelfReview && feedback.expected.length > 0 && feedback.verdict !== 'correct' && !imageOnlyChoice && <ExpectedAnswer question={question} feedback={feedback} />}

      {pendingSelfReview && <ExpectedAnswer question={question} feedback={feedback} />}

      {onAcceptAsCorrect && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-dashed border-rule px-4 py-2.5">
          <p className="text-sm text-ink-muted">Your answer means the same thing in another wording?</p>
          <Button size="sm" icon={<CheckCircle2 className="size-4" />} onClick={onAcceptAsCorrect}>
            I was right
          </Button>
        </div>
      )}

      {question.explanation && !pendingSelfReview && (
        <div className="rounded-md bg-sheet-2 px-4 py-3">
          <Markdown compact>{question.explanation}</Markdown>
        </div>
      )}
      {!pendingSelfReview && question.explanationMedia.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">Show the explanation from your book</summary>
          <MediaList media={question.explanationMedia} className="mt-2" />
        </details>
      )}

      {feedback.limitations && <p className="text-xs text-ink-faint">{feedback.limitations}</p>}
    </section>
  );
}

function ExpectedAnswer({ question, feedback }: { question: Question; feedback: Feedback }) {
  const isCode = question.type === 'code' || question.type === 'sql';
  const isModel = question.type === 'long' || isCode;
  if (isCode) {
    return (
      <details className="rounded-md border border-rule">
        <summary className="cursor-pointer px-3 py-2 text-sm text-ink-muted hover:text-ink">Show the model solution</summary>
        <pre className="overflow-x-auto border-t border-rule bg-sheet-2 p-3 font-code text-sm text-ink">{feedback.expected[0]}</pre>
      </details>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-ink-muted">{isModel ? 'Model answer' : feedback.expected.length > 1 ? 'Accepted answers' : 'Answer'}</p>
      {isModel ? (
        <Markdown compact className="rounded-md border border-rule px-4 py-3">
          {feedback.expected[0] ?? ''}
        </Markdown>
      ) : (
        <p className="text-lg text-ink" lang={question.language === 'zh' ? 'zh-CN' : question.language}>
          {feedback.expected.slice(0, 4).join('  ·  ')}
        </p>
      )}
    </div>
  );
}

function SelfReview({ feedback, onConfirm }: { feedback: Feedback; onConfirm: (score: number) => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries((feedback.rubric ?? []).map((criterion) => [criterion.id, criterion.detected])));
  const rubric = feedback.rubric ?? [];
  const total = rubric.reduce((sum, criterion) => sum + criterion.weight, 0);
  const score = total ? rubric.reduce((sum, criterion) => sum + (checked[criterion.id] ? criterion.weight : 0), 0) / total : 0;

  if (rubric.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-print-line bg-print-soft px-4 py-3">
        <p className="text-sm">Compare your answer with the reference below, then mark it:</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => onConfirm(1)}>
            I got it right
          </Button>
          <Button size="sm" onClick={() => onConfirm(0.5)}>
            Partly right
          </Button>
          <Button size="sm" onClick={() => onConfirm(0)}>
            Not yet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-md border border-print-line bg-print-soft px-4 py-3">
      <legend className="px-1 text-sm font-medium">Tick what your answer covered</legend>
      {rubric.map((criterion) => (
        <label key={criterion.id} className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={Boolean(checked[criterion.id])}
            onChange={(event) => setChecked((current) => ({ ...current, [criterion.id]: event.target.checked }))}
            className="mt-0.5 size-4 accent-[var(--print)]"
          />
          <span>
            {criterion.label}
            {criterion.detected && <span className="ml-1.5 text-xs text-ink-faint">(found in your answer)</span>}
          </span>
        </label>
      ))}
      <div className="mt-1 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={() => onConfirm(score)}>
          Confirm my mark
        </Button>
        <span className="tabular text-sm text-ink-muted">{Math.round(score * 100)}%</span>
      </div>
    </fieldset>
  );
}

function RunOutput({ run }: { run: RunResponse }) {
  const yours = run.tables?.at(-1);
  const hasText = run.stdout.trim() || run.stderr.trim();
  if (!hasText && !yours && !run.expected) return null;
  return (
    <div className="flex flex-col gap-3">
      {hasText && (
        <details open={Boolean(run.stdout.trim())} className="rounded-md border border-rule">
          <summary className="cursor-pointer px-3 py-1.5 text-sm text-ink-muted">Program output</summary>
          <pre className="max-h-64 overflow-auto border-t border-rule bg-sheet-2 p-3 font-code text-xs whitespace-pre-wrap text-ink">
            {run.stdout}
            {run.stderr && <span className="text-wrong">{run.stderr}</span>}
          </pre>
        </details>
      )}
      {yours && <ResultTable table={yours} caption="Your result" />}
      {run.expected && (!yours || JSON.stringify(yours.rows) !== JSON.stringify(run.expected.rows)) && <ResultTable table={run.expected} caption="Expected result" />}
    </div>
  );
}
