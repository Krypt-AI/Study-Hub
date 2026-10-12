/**
 * One exam section as on paper: the question booklet beside an answer sheet of numbered
 * bubbles, the section clock and the finish button. Nothing is marked until the end.
 */
import { Pause, Play } from 'lucide-react';
import { type KeyboardEvent, useEffect, useEffectEvent, useRef, useState } from 'react';
import { MediaList } from '@/components/media/MediaList';
import { PageImage } from '@/components/media/PageImage';
import { audioClipUrl } from '@/components/media/audioClip';
import { type ClipPlayer, useClipPlayer } from '@/components/media/useClipPlayer';
import { Markdown } from '@/components/Markdown';
import { Bubble } from '@/components/ui/Bubble';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { isNumberedChoice } from '@/domain/content/questions';
import type { AssessmentSection, ChoiceQuestion, Media, Question } from '@/domain/content/types';
import type { Response } from '@/domain/evaluation/types';
import { cn } from '@/lib/cn';
import { QuestionInput } from '../QuestionCard';
import { emptyResponse, hasAnswer } from '../session/responses';

export type FinishReason = 'finished' | 'time-up';

export interface ExamSectionProps {
  assessmentTitle: string;
  section: AssessmentSection;
  index: number;
  count: number;
  answers: Readonly<Record<string, Response>>;
  onAnswer: (questionId: string, response: Response) => void;
  startedAt: number;
  /** Absent when the sitting is untimed. */
  endsAt?: number;
  onFinish: (reason: FinishReason) => void;
  contentLang?: 'zh-CN' | 'ja';
}

type PageMedia = Extract<Media, { kind: 'page-image' }>;

export function ExamSection({ assessmentTitle, section, index, count, answers, onAnswer, startedAt, endsAt, onFinish, contentLang }: ExamSectionProps) {
  const [confirming, setConfirming] = useState(false);
  const player = useClipPlayer();
  const clock = useSectionClock(startedAt, endsAt, () => onFinish('time-up'));
  const answered = section.questions.filter((question) => hasAnswer(answers[question.id])).length;
  const unanswered = section.questions.length - answered;
  const isLast = index + 1 === count;
  const pages = section.media.filter((media): media is PageMedia => media.kind === 'page-image');
  const sectionMedia = section.media.filter((media) => media.kind !== 'page-image');

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-rule bg-sheet/95 px-4 py-2.5 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-ink-muted">
            {assessmentTitle} · section {index + 1} of {count}
          </p>
          <h1 className="truncate text-lg leading-tight font-semibold" lang={contentLang}>
            {section.title}
          </h1>
        </div>
        <span className="tabular text-sm text-ink-muted">
          {answered} / {section.questions.length} marked
        </span>
        <SectionClock clock={clock} />
        <Button variant="primary" onClick={() => (unanswered > 0 ? setConfirming(true) : onFinish('finished'))}>
          {isLast ? 'Finish exam' : 'Finish section'}
        </Button>
      </div>

      {section.instructions && <p className="text-sm text-ink-muted">{section.instructions}</p>}
      {player.error && <p className="text-sm text-wrong">{player.error}</p>}
      <MediaList media={sectionMedia} />

      <div className={pages.length > 0 ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,1fr)]' : 'mx-auto w-full max-w-4xl'}>
        {pages.length > 0 && <Booklet pages={pages} />}
        <AnswerSheet section={section} answers={answers} onAnswer={onAnswer} player={player} hasBooklet={pages.length > 0} contentLang={contentLang} />
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={isLast ? 'Finish the exam?' : 'Finish this section?'}
        footer={
          <>
            <Button onClick={() => setConfirming(false)}>Keep working</Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirming(false);
                onFinish('finished');
              }}
            >
              {isLast ? 'Finish exam' : 'Finish section'}
            </Button>
          </>
        }
      >
        <p className="px-4 py-3 text-sm">
          {unanswered} question{unanswered === 1 ? ' is' : 's are'} not answered.{' '}
          {isLast ? 'Your answers will be marked now.' : 'You cannot come back to this section, as in the real test.'}
        </p>
      </Dialog>
    </div>
  );
}

interface Clock {
  mode: 'remaining' | 'elapsed';
  ms: number;
}

/** Ticks once a second; calls `onTimeUp` once when a timed section runs out. */
function useSectionClock(startedAt: number, endsAt: number | undefined, onTimeUp: () => void): Clock {
  const [now, setNow] = useState(startedAt);
  const fired = useRef(false);
  const tick = useEffectEvent((current: number) => {
    setNow(current);
    if (endsAt !== undefined && current >= endsAt && !fired.current) {
      fired.current = true;
      onTimeUp();
    }
  });
  useEffect(() => {
    const timer = window.setInterval(() => tick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return endsAt === undefined ? { mode: 'elapsed', ms: Math.max(0, now - startedAt) } : { mode: 'remaining', ms: Math.max(0, endsAt - now) };
}

const formatClock = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

function SectionClock({ clock }: { clock: Clock }) {
  const urgent = clock.mode === 'remaining' && clock.ms <= 60_000;
  const soon = clock.mode === 'remaining' && clock.ms <= 300_000;
  return (
    <div className="flex items-baseline gap-1.5">
      <span role="timer" className={cn('display-numerals text-2xl font-semibold', urgent ? 'text-wrong' : soon ? 'text-slip' : 'text-ink')}>
        {formatClock(clock.ms)}
      </span>
      <span className="text-xs text-ink-muted">{clock.mode === 'remaining' ? 'left' : 'elapsed'}</span>
      {/* Announced twice per section rather than every second. */}
      <span className="sr-only" aria-live="polite">
        {urgent ? 'One minute left in this section.' : soon ? 'Five minutes left in this section.' : ''}
      </span>
    </div>
  );
}

function Booklet({ pages }: { pages: PageMedia[] }) {
  return (
    <section aria-label="Question booklet" className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:pr-2">
      {pages.map((page) => (
        <figure key={`${page.sourceId}-${page.page}`} className="flex flex-col gap-1">
          <PageImage sourceId={page.sourceId} page={page.page} crop={page.crop} alt={page.alt ?? `Question booklet, page ${page.page}`} />
          <figcaption className="tabular text-right text-xs text-ink-faint">p.{page.page}</figcaption>
        </figure>
      ))}
    </section>
  );
}

interface SheetGroup {
  title?: string;
  entries: Array<{ question: Question; number: string }>;
}

/** Consecutive questions grouped by their printed group (問題1, 問題2 …), numbered as printed. */
function groupForSheet(questions: Question[]): SheetGroup[] {
  const groups: SheetGroup[] = [];
  questions.forEach((question, position) => {
    const title = question.sheet?.group;
    const entry = { question, number: question.sheet?.number ?? String(position + 1) };
    const last = groups.at(-1);
    if (last && last.title === title) last.entries.push(entry);
    else groups.push({ title, entries: [entry] });
  });
  return groups;
}

interface AnswerSheetProps {
  section: AssessmentSection;
  answers: Readonly<Record<string, Response>>;
  onAnswer: (questionId: string, response: Response) => void;
  player: ClipPlayer;
  hasBooklet: boolean;
  contentLang?: 'zh-CN' | 'ja';
}

function AnswerSheet({ section, answers, onAnswer, player, hasBooklet, contentLang }: AnswerSheetProps) {
  return (
    <section aria-label="Answer sheet" className="flex flex-col gap-5 rounded-md border border-rule bg-sheet px-4 py-3">
      {groupForSheet(section.questions).map((group, groupIndex) => (
        <div key={group.title ?? groupIndex} className="flex flex-col">
          {group.title && (
            <h2 className="border-b border-print-line pb-1 font-display text-sm font-semibold text-print-strong" lang={contentLang}>
              {group.title}
            </h2>
          )}
          <ol className="flex flex-col">
            {group.entries.map(({ question, number }) => {
              const response = answers[question.id] ?? emptyResponse(question);
              return hasBooklet && isNumberedChoice(question) ? (
                <MarkRow
                  key={question.id}
                  question={question}
                  number={number}
                  selected={response.type === 'choice' ? response.selected : []}
                  onSelect={(selected) => onAnswer(question.id, { type: 'choice', selected })}
                  player={player}
                />
              ) : (
                <li key={question.id} className="flex flex-col gap-3 border-b border-rule py-4 last:border-b-0">
                  <div className="flex items-baseline gap-3">
                    <span className="display-numerals text-print">{number}</span>
                    <div lang={contentLang} className="min-w-0 flex-1">
                      <Markdown className="text-[1.0625rem]">{question.prompt}</Markdown>
                    </div>
                  </div>
                  <MediaList media={hasBooklet ? question.media.filter((media) => media.kind !== 'page-image') : question.media} />
                  <QuestionInput question={question} draft={response} onChange={(draft) => onAnswer(question.id, draft)} onSubmit={() => undefined} locked={false} />
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}

interface MarkRowProps {
  question: ChoiceQuestion;
  number: string;
  selected: string[];
  onSelect: (selected: string[]) => void;
  player: ClipPlayer;
}

/** A printed answer row: the question number and one bubble per option. Keys 1-9 and arrows mark it. */
function MarkRow({ question, number, selected, onSelect, player }: MarkRowProps) {
  const clip = question.media.find((media): media is Extract<Media, { kind: 'audio' }> => media.kind === 'audio');
  const { options } = question;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = options.findIndex((option) => selected.includes(option.id));
    let next = -1;
    if (/^[1-9]$/u.test(event.key)) next = Number(event.key) - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % options.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    event.preventDefault();
    onSelect([option.id]);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <li className="flex items-center gap-3 border-b border-rule py-1.5 last:border-b-0">
      <span className="display-numerals w-7 shrink-0 text-right text-print">{number}</span>
      {clip && <ClipButton src={audioClipUrl(clip)} title={clip.title} player={player} />}
      <div role="radiogroup" aria-label={`Question ${number}`} className="flex gap-1" onKeyDown={onKeyDown}>
        {options.map((option, position) => {
          const chosen = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={chosen}
              aria-label={`Answer ${option.text}`}
              tabIndex={chosen || (selected.length === 0 && position === 0) ? 0 : -1}
              // Clicking a marked bubble erases it, like rubbing out a pencil mark.
              onClick={() => onSelect(chosen ? [] : [option.id])}
              className="rounded-full p-1 transition-transform duration-150 hover:scale-105"
            >
              <Bubble state={chosen ? 'filled' : 'empty'} size="lg" label={option.text} animate={chosen} />
            </button>
          );
        })}
      </div>
    </li>
  );
}

function ClipButton({ src, title, player }: { src: string; title?: string; player: ClipPlayer }) {
  const playing = player.playing === src;
  const played = player.played.has(src);
  return (
    <button
      type="button"
      onClick={() => player.toggle(src)}
      aria-pressed={playing}
      aria-label={`${playing ? 'Pause' : 'Play'} ${title ?? 'the clip'}${played && !playing ? ' (played)' : ''}`}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
        playing ? 'border-print bg-print text-on-print' : played ? 'border-rule-strong text-ink-faint hover:text-ink' : 'border-print-line text-print hover:bg-print-soft',
      )}
    >
      {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
    </button>
  );
}
