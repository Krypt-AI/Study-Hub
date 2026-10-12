/**
 * A mock exam or quiz sat like the real thing: cover page, timed sections one after another,
 * marking at the end, then results. An unfinished sitting is kept in this browser, so after a
 * reload or a detour it can be resumed from the cover page.
 */
import { useEffect, useState } from 'react';
import { useBlocker, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState, LoadingState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/useToast';
import { PartialRecordError, useRecordAnswers } from '@/data/queries';
import { contentLanguage } from '@/domain/content/language';
import { useCourse } from '@/domain/content/load';
import { findAssessment } from '@/domain/content/navigation';
import type { Assessment, Course } from '@/domain/content/types';
import { confirmSelfReview } from '@/domain/evaluation/evaluate';
import type { Response } from '@/domain/evaluation/types';
import type { AnswerContext } from '@/domain/learning/recordAnswer';
import { ExamIntro } from './exam/ExamIntro';
import { clearExamDraft, type ExamDraft, loadExamDraft, saveExamDraft } from './exam/examDraft';
import { ExamResults } from './exam/ExamResults';
import { ExamSection, type FinishReason } from './exam/ExamSection';
import { answerContexts, type GradedSection, gradeSection } from './exam/gradeExam';

export default function AssessmentPage() {
  const { courseId = '', assessmentId = '' } = useParams();
  const course = useCourse(courseId);

  if (course.error) return <ErrorState title="This course could not be loaded" error={course.error} onRetry={() => void course.refetch()} />;
  if (!course.data) return <LoadingState />;
  const assessment = findAssessment(course.data, assessmentId);
  if (!assessment) return <ErrorState title="Exam not found" error={`No exam "${assessmentId}" in ${course.data.title}.`} />;
  return <ExamView key={assessment.id} course={course.data} assessment={assessment} />;
}

type Stage =
  | { kind: 'intro' }
  | { kind: 'sitting'; index: number; startedAt: number; endsAt?: number; timesMs: number[] }
  | { kind: 'marking' }
  | { kind: 'results'; graded: GradedSection[] };

function ExamView({ course, assessment }: { course: Course; assessment: Assessment }) {
  const [stage, setStage] = useState<Stage>({ kind: 'intro' });
  const [timed, setTimed] = useState(true);
  const [answers, setAnswers] = useState<Record<string, Response>>({});
  const [draft, setDraft] = useState(() => loadExamDraft(course.id, assessment.id, assessment.sections.length));
  const [markingError, setMarkingError] = useState<string>();
  const record = useRecordAnswers();
  const toast = useToast();
  const sitting = stage.kind === 'sitting';
  const blocker = useBlocker(({ currentLocation, nextLocation }) => sitting && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (stage.kind !== 'sitting') return;
    const { index, startedAt, endsAt, timesMs } = stage;
    saveExamDraft(course.id, assessment.id, { version: 1, sectionIndex: index, startedAt, endsAt, timesMs, timed, answers });
  }, [course.id, assessment.id, stage, timed, answers]);

  const resume = (saved: ExamDraft) => {
    setTimed(saved.timed);
    setAnswers(saved.answers);
    setStage({ kind: 'sitting', index: saved.sectionIndex, startedAt: saved.startedAt, endsAt: saved.endsAt, timesMs: saved.timesMs });
  };

  const discardDraft = () => {
    clearExamDraft(course.id, assessment.id);
    setDraft(undefined);
  };

  const save = (contexts: AnswerContext[]) => {
    if (contexts.length > 0) record.mutate(contexts);
  };

  const startSection = (index: number, timesMs: number[]) => {
    const minutes = assessment.sections[index]?.timeLimitMinutes;
    const startedAt = Date.now();
    setStage({ kind: 'sitting', index, startedAt, endsAt: timed && minutes ? startedAt + minutes * 60_000 : undefined, timesMs });
  };

  const finishSection = async (reason: FinishReason) => {
    if (stage.kind !== 'sitting') return;
    const timesMs = [...stage.timesMs, Date.now() - stage.startedAt];
    if (reason === 'time-up') toast.show(`Time is up: section ${stage.index + 1} is closed.`);
    if (stage.index + 1 < assessment.sections.length) {
      startSection(stage.index + 1, timesMs);
      return;
    }
    setStage({ kind: 'marking' });
    discardDraft();
    try {
      const graded: GradedSection[] = [];
      for (const [index, section] of assessment.sections.entries()) graded.push(await gradeSection(section, answers, timesMs[index] ?? 0));
      setStage({ kind: 'results', graded });
      save(graded.flatMap((section) => answerContexts(course.id, assessment, section.items)));
    } catch (error) {
      setMarkingError(error instanceof Error ? error.message : String(error));
    }
  };

  const confirmItem = (sectionIndex: number, itemIndex: number, score: number) => {
    if (stage.kind !== 'results') return;
    const item = stage.graded[sectionIndex]?.items[itemIndex];
    if (!item) return;
    const confirmed = { ...item, feedback: confirmSelfReview(item.feedback, score) };
    setStage({
      kind: 'results',
      graded: stage.graded.map((section, position) =>
        position === sectionIndex ? { ...section, items: section.items.map((candidate, index) => (index === itemIndex ? confirmed : candidate)) } : section,
      ),
    });
    save(answerContexts(course.id, assessment, [confirmed]).map((context) => ({ ...context, selfAssessed: true })));
  };

  const retake = () => {
    discardDraft();
    setAnswers({});
    setMarkingError(undefined);
    setStage({ kind: 'intro' });
  };

  let view;
  switch (stage.kind) {
    case 'intro':
      view = (
        <ExamIntro
          course={course}
          assessment={assessment}
          timed={timed}
          onTimedChange={setTimed}
          onStart={() => startSection(0, [])}
          resumable={draft && { section: draft.sectionIndex + 1, answered: Object.keys(draft.answers).length, onResume: () => resume(draft), onDiscard: discardDraft }}
        />
      );
      break;
    case 'sitting': {
      const section = assessment.sections[stage.index];
      view = section && (
        <ExamSection
          key={section.id}
          assessmentTitle={assessment.title}
          section={section}
          index={stage.index}
          count={assessment.sections.length}
          answers={answers}
          onAnswer={(questionId, response) => setAnswers((current) => ({ ...current, [questionId]: response }))}
          startedAt={stage.startedAt}
          endsAt={stage.endsAt}
          onFinish={(reason) => void finishSection(reason)}
          contentLang={contentLanguage(course)}
        />
      );
      break;
    }
    case 'marking':
      view = markingError ? (
        <ErrorState title="Your answers could not be marked" error={markingError} onRetry={retake} />
      ) : (
        <LoadingState label="Marking your answers…" />
      );
      break;
    case 'results':
      view = (
        <ExamResults
          course={course}
          assessment={assessment}
          graded={stage.graded}
          save={{
            pending: record.isPending,
            error: record.error?.message,
            onRetry: () => save(record.error instanceof PartialRecordError ? record.error.remaining : []),
          }}
          onConfirmSelfReview={confirmItem}
          onRetake={retake}
        />
      );
      break;
  }

  return (
    <>
      {view}
      <Dialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Leave the exam?"
        footer={
          <>
            <Button onClick={() => blocker.reset?.()}>Stay</Button>
            <Button variant="danger" onClick={() => blocker.proceed?.()}>
              Leave
            </Button>
          </>
        }
      >
        <p className="px-4 py-3 text-sm">
          Your answers so far are kept in this browser: you can resume from the exam page. The section clock keeps running while you are away.
        </p>
      </Dialog>
    </>
  );
}
