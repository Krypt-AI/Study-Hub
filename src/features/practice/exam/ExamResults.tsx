/**
 * Marked exam: raw score overall and per section, time used, then every question with
 * your answer, the correct one and the explanation (listening scripts included).
 */
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { MediaList } from '@/components/media/MediaList';
import { Markdown } from '@/components/Markdown';
import { Bubble, BubbleStrip } from '@/components/ui/Bubble';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { contentLanguage } from '@/domain/content/language';
import type { Assessment, Course } from '@/domain/content/types';
import { courseUrl } from '@/domain/content/urls';
import { FeedbackPanel } from '../FeedbackPanel';
import { describeResponse } from '../session/responses';
import { verdictBubble } from '../session/usePracticeSession';
import { countsAsCorrect, type GradedItem, type GradedSection, passed, scoreExam, scoreItems } from './gradeExam';

export interface ExamResultsProps {
  course: Course;
  assessment: Assessment;
  graded: GradedSection[];
  save: { pending: boolean; error?: string; onRetry: () => void };
  onConfirmSelfReview: (sectionIndex: number, itemIndex: number, score: number) => void;
  onRetake: () => void;
}

const formatPoints = (points: number) => (Number.isInteger(points) ? String(points) : points.toFixed(1));
const formatMinutes = (ms: number) => `${Math.max(1, Math.round(ms / 60_000))} min`;

const itemBubble = (item: GradedItem) => (!item.answered ? 'empty' : item.feedback.verdict === 'self-review' ? 'current' : verdictBubble(item.feedback.verdict));

export function ExamResults({ course, assessment, graded, save, onConfirmSelfReview, onRetake }: ExamResultsProps) {
  const total = scoreExam(graded);
  const result = passed(assessment, total);
  const anyMissed = graded.some((section) => section.items.some((item) => !countsAsCorrect(item)));
  const [filter, setFilter] = useState<'missed' | 'all'>(anyMissed ? 'missed' : 'all');
  const lang = contentLanguage(course);

  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap gap-1.5 text-sm text-ink-muted">
        <Link to="/courses" className="hover:text-ink">
          Courses
        </Link>
        <span aria-hidden>/</span>
        <Link to={courseUrl(course.id)} className="hover:text-ink">
          {course.title}
        </Link>
      </nav>
      <PageHeader
        title={assessment.title}
        lead="Results"
        actions={
          <>
            <Button icon={<RotateCcw className="size-4" />} onClick={onRetake}>
              Sit again
            </Button>
            <ButtonLink to={courseUrl(course.id)} variant="primary">
              Back to course
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <Sheet title="Score" aside={<SaveStatus save={save} />}>
          <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
            <div>
              <p className="display-numerals text-5xl leading-none font-semibold">
                {formatPoints(total.points)}
                <span className="text-2xl text-ink-faint"> / {total.max}</span>
              </p>
              <p className="tabular mt-2 text-ink-muted">
                {total.max ? Math.round((total.points / total.max) * 100) : 0}%
                {result !== undefined && (result ? <span className="text-correct"> · pass mark met</span> : <span className="text-wrong"> · below the pass mark</span>)}
              </p>
            </div>
            <table className="min-w-0 flex-1 text-sm">
              <tbody>
                {graded.map(({ section, items, timeUsedMs }) => {
                  const score = scoreItems(items);
                  return (
                    <tr key={section.id} className="border-b border-rule last:border-b-0">
                      <th scope="row" className="py-2 pr-3 text-left font-medium" lang={lang}>
                        {section.title}
                      </th>
                      <td className="hidden py-2 pr-3 md:table-cell">
                        <BubbleStrip states={items.map(itemBubble)} label={`${section.title}: marks`} />
                      </td>
                      <td className="tabular py-2 pr-3 text-right whitespace-nowrap">
                        {formatPoints(score.points)} / {score.max}
                      </td>
                      <td className="tabular py-2 text-right whitespace-nowrap text-ink-muted">{formatMinutes(timeUsedMs)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col gap-1 text-xs text-ink-faint">
            {total.pending > 0 && (
              <p className="text-sm text-slip">
                {total.pending} answer{total.pending === 1 ? ' waits' : 's wait'} for your review below and {total.pending === 1 ? 'is' : 'are'} not counted yet.
              </p>
            )}
            {assessment.kind === 'mock-exam' && <p>Raw score, one point per question. The official exam reports scaled scores with sectional pass marks, so treat this as a guide.</p>}
            <p>Unanswered questions score zero and are not added to your reviews.</p>
          </div>
        </Sheet>

        <Sheet
          title="Your answers"
          aside={
            <Segmented<'missed' | 'all'>
              label="Show answers"
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'missed', label: 'Missed' },
                { id: 'all', label: 'All' },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-6">
            {graded.map((gradedSection, sectionIndex) => {
              const visible = gradedSection.items.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => filter === 'all' || !countsAsCorrect(item));
              return (
                <section key={gradedSection.section.id} className="flex flex-col">
                  <h3 className="border-b border-print-line pb-1 font-display font-semibold" lang={lang}>
                    {gradedSection.section.title}
                  </h3>
                  {visible.length === 0 ? (
                    <p className="py-3 text-sm text-ink-muted">Everything in this section was right.</p>
                  ) : (
                    <ol>
                      {visible.map(({ item, itemIndex }) => (
                        <ResultRow
                          key={item.question.id}
                          item={item}
                          number={item.question.sheet?.number ?? String(itemIndex + 1)}
                          lang={lang}
                          onConfirmSelfReview={(score) => onConfirmSelfReview(sectionIndex, itemIndex, score)}
                        />
                      ))}
                    </ol>
                  )}
                </section>
              );
            })}
          </div>
        </Sheet>
      </div>
    </div>
  );
}

function SaveStatus({ save }: { save: ExamResultsProps['save'] }) {
  if (save.pending) return <span>Saving to your progress…</span>;
  if (save.error) {
    return (
      <span className="flex items-center gap-2 text-wrong">
        Not saved
        <Button size="sm" onClick={save.onRetry}>
          Retry
        </Button>
      </span>
    );
  }
  return <span>Saved to your progress</span>;
}

function ResultRow({ item, number, lang, onConfirmSelfReview }: { item: GradedItem; number: string; lang?: string; onConfirmSelfReview: (score: number) => void }) {
  const pending = item.feedback.verdict === 'self-review';
  const [open, setOpen] = useState(pending);
  const yours = item.answered ? describeResponse(item.response, item.question) : 'not answered';
  const expected = item.feedback.expected[0];
  const isCode = item.question.type === 'code' || item.question.type === 'sql';

  return (
    <li className="border-b border-rule last:border-b-0">
      <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded px-1 py-2 hover:bg-sheet-2">
          <span className="display-numerals w-8 shrink-0 text-right text-print">{number}</span>
          <Bubble state={itemBubble(item)} />
          <span className="min-w-0 flex-1 truncate text-sm">
            <span className="text-ink-muted">yours </span>
            {isCode ? 'code' : yours}
          </span>
          {!countsAsCorrect(item) && expected && !isCode && (
            <span className="max-w-[40%] truncate text-sm" lang={lang}>
              <span className="text-ink-muted">answer </span>
              <span className="font-medium">{expected}</span>
            </span>
          )}
        </summary>
        {open && (
          <div className="flex flex-col gap-3 pt-1 pb-4 pl-12">
            <div lang={lang}>
              <Markdown compact>{item.question.prompt}</Markdown>
            </div>
            <MediaList media={item.question.media} />
            <FeedbackPanel question={item.question} feedback={item.feedback} run={item.run} pendingSelfReview={pending} onConfirmSelfReview={onConfirmSelfReview} />
          </div>
        )}
      </details>
    </li>
  );
}
