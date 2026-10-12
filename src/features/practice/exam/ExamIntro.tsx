/** The exam's cover page: sections and timing, how the sitting works, and the start button. */
import { Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { SourceBadge } from '@/components/SourceBadge';
import { Button } from '@/components/ui/Button';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { contentLanguage } from '@/domain/content/language';
import type { Assessment, Course } from '@/domain/content/types';
import { courseUrl } from '@/domain/content/urls';

export interface ExamIntroProps {
  course: Course;
  assessment: Assessment;
  timed: boolean;
  onTimedChange: (timed: boolean) => void;
  onStart: () => void;
  /** An unfinished sitting kept in this browser. */
  resumable?: { section: number; answered: number; onResume: () => void; onDiscard: () => void };
}

export function ExamIntro({ course, assessment, timed, onTimedChange, onStart, resumable }: ExamIntroProps) {
  const questionCount = assessment.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const hasTimes = assessment.sections.some((section) => section.timeLimitMinutes);
  const minutes = assessment.sections.reduce((sum, section) => sum + (section.timeLimitMinutes ?? 0), 0);
  const hasAudio = assessment.sections.some((section) => section.questions.some((question) => question.media.some((media) => media.kind === 'audio')));
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
      <PageHeader title={assessment.title} lead={assessment.kind === 'mock-exam' ? 'Mock exam' : 'Quiz'} actions={<SourceBadge source={assessment.source} />} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Sheet title="Sections" aside={<span className="tabular">{questionCount} questions{hasTimes ? ` · ${minutes} min` : ''}</span>} padded={false}>
          <ol className="divide-y divide-rule">
            {assessment.sections.map((section, index) => (
              <li key={section.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                <span className="display-numerals text-right text-print">{index + 1}</span>
                <span className="min-w-0 truncate font-medium" lang={lang}>
                  {section.title}
                </span>
                <span className="tabular text-right text-sm text-ink-muted">
                  {section.questions.length} q{section.timeLimitMinutes ? ` · ${section.timeLimitMinutes} min` : ''}
                </span>
              </li>
            ))}
          </ol>
        </Sheet>

        <Sheet title="How the sitting works">
          <div className="flex flex-col gap-4">
            {assessment.description && <Markdown compact>{assessment.description}</Markdown>}
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-muted">
              <li>Mark one answer per question on the answer sheet. Nothing is checked until you finish.</li>
              <li>Sections come one after another. Once you finish a section you cannot return to it, as in the real test.</li>
              {hasAudio && <li>Play each listening clip from its row on the answer sheet. In the real test you hear each clip once.</li>}
              <li>Your answers are saved to your progress when you finish. Questions you miss come back in your reviews.</li>
              <li>If you leave or reload mid-sitting, you can resume here. A section's clock keeps running meanwhile.</li>
            </ul>
            {resumable && (
              <div className="flex flex-col gap-3 rounded-md border border-print-line bg-print-soft px-4 py-3">
                <p className="text-sm">
                  You have an unfinished sitting: section {resumable.section} of {assessment.sections.length}, {resumable.answered}{' '}
                  {resumable.answered === 1 ? 'answer' : 'answers'} marked.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" icon={<Play className="size-4" />} onClick={resumable.onResume}>
                    Resume section {resumable.section}
                  </Button>
                  <Button icon={<RotateCcw className="size-4" />} onClick={resumable.onDiscard}>
                    Start again
                  </Button>
                </div>
              </div>
            )}
            {!resumable && hasTimes && (
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={timed} onChange={(event) => onTimedChange(event.target.checked)} className="size-4 accent-[var(--print)]" />
                Time each section and close it when its time runs out
              </label>
            )}
            {!resumable && (
              <Button variant="primary" size="lg" icon={<Play className="size-4" />} onClick={onStart} className="self-start">
                Start section 1
              </Button>
            )}
          </div>
        </Sheet>
      </div>
    </div>
  );
}
