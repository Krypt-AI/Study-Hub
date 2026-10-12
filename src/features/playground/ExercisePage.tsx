/**
 * An exercise you wrote for yourself: practise it (run the tests in the sandbox, use hints,
 * compare with your solution) or edit it (task, starter code, solution, tests). Every
 * checked attempt is kept as a submission.
 */
import { CheckCircle2, Lightbulb, Play, Plus, Trash2, XCircle } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Markdown } from '@/components/Markdown';
import { Button, IconButton, Spinner } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/useToast';
import { useCustomExercises, useSubmissions } from '@/data/queries';
import type { CustomExerciseRecord } from '@/data/records';
import type { CodeLanguage, CodeQuestion, CodeTest } from '@/domain/content/types';
import { exerciseUrl } from '@/domain/content/urls';
import { FeedbackPanel } from '@/features/practice/FeedbackPanel';
import { type Judgement, judgeResponse } from '@/features/practice/session/judge';
import { relativeTime } from '@/lib/dates';
import { isRunnableLanguage } from './execution/codeRunner';
import { LANGUAGES, languageInfo } from './languages';
import { newExercise, useExerciseMutations } from './usePlaygroundMutations';

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

/** Exercises are checked by code tests, which SQL does not use. */
const EXERCISE_LANGUAGES = LANGUAGES.filter((language) => language.id !== 'sql');

const ASSERT_EXAMPLES: Partial<Record<CodeLanguage, string>> = {
  python: 'assert add(2, 3) == 5',
  javascript: 'assertEqual(add(2, 3), 5)',
  typescript: 'assertEqual(add(2, 3), 5)',
};

/** The exercise as a code question, so it is judged exactly like course exercises. */
function exerciseQuestion(exercise: CustomExerciseRecord): CodeQuestion {
  return {
    id: exercise.id,
    type: 'code',
    prompt: exercise.prompt,
    skill: 'apply',
    topics: [],
    hints: exercise.hints,
    media: [],
    explanationMedia: [],
    source: { origin: 'authored', title: 'Your exercise', flags: [] },
    tags: exercise.tags,
    language: exercise.language,
    starterCode: exercise.starterCode,
    tests: exercise.tests,
    solution: exercise.solution || undefined,
    timeoutMs: 8000,
    packages: [],
  };
}

export default function ExercisePage() {
  const { exerciseId = '' } = useParams();
  const exercises = useCustomExercises();
  const [fresh] = useState(() => newExercise());

  if (exercises.error) return <ErrorState title="Your exercises could not be loaded" error={exercises.error} />;
  if (!exercises.data) return <LoadingState />;
  const isNew = exerciseId === 'new';
  const exercise = isNew ? fresh : exercises.data.find((candidate) => candidate.id === exerciseId);
  if (!exercise) return <ErrorState title="Exercise not found" error="It may have been deleted." />;
  return <ExerciseView key={exercise.id} initial={exercise} isNew={isNew} />;
}

function ExerciseView({ initial, isNew }: { initial: CustomExerciseRecord; isNew: boolean }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'practise' | 'edit'>(isNew ? 'edit' : 'practise');
  const [exercise, setExercise] = useState(initial);

  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-ink-muted">
        <Link to="/playground" className="hover:text-ink">
          Playground
        </Link>
      </nav>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-semibold">{exercise.title || 'Untitled exercise'}</h1>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Tag>{languageInfo(exercise.language).name}</Tag>
            <Tag>
              {exercise.tests.length} test{exercise.tests.length === 1 ? '' : 's'}
            </Tag>
            {exercise.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        </div>
        <Segmented<'practise' | 'edit'>
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { id: 'practise', label: 'Practise' },
            { id: 'edit', label: 'Edit' },
          ]}
        />
      </header>
      {mode === 'practise' ? (
        <PractisePanel key={exercise.updatedAt} exercise={exercise} />
      ) : (
        <EditPanel
          exercise={exercise}
          onSaved={(saved) => {
            setExercise(saved);
            setMode('practise');
            if (isNew) void navigate(exerciseUrl(saved.id), { replace: true });
          }}
          onDeleted={() => void navigate('/playground')}
          isNew={isNew}
        />
      )}
    </div>
  );
}

function PractisePanel({ exercise }: { exercise: CustomExerciseRecord }) {
  const question = useMemo(() => exerciseQuestion(exercise), [exercise]);
  const submissions = useSubmissions(exercise.id);
  const { submit } = useExerciseMutations();
  const [code, setCode] = useState(exercise.starterCode);
  const [judgement, setJudgement] = useState<Judgement>();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [hintsShown, setHintsShown] = useState(0);
  const runnable = isRunnableLanguage(exercise.language);

  const check = async () => {
    if (running) return;
    setRunning(true);
    setError(undefined);
    try {
      const result = await judgeResponse(question, { type: 'code', code }, setStatus);
      setJudgement(result);
      if (result.run) {
        submit.mutate({
          exerciseId: exercise.id,
          code,
          passed: result.feedback.verdict === 'correct',
          testsPassed: result.run.tests.filter((test) => test.passed).length,
          testsTotal: question.tests.length,
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRunning(false);
      setStatus(undefined);
    }
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <Sheet title="Task">
          <Markdown>{exercise.prompt || '_No task written yet: switch to Edit._'}</Markdown>
        </Sheet>
        {exercise.hints.length > 0 && (
          <Sheet title="Hints" aside={<span className="tabular">{hintsShown} / {exercise.hints.length}</span>}>
            <div className="flex flex-col gap-2">
              {exercise.hints.slice(0, hintsShown).map((hint, index) => (
                <p key={index} className="flex gap-2 text-sm">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-print" aria-hidden /> {hint}
                </p>
              ))}
              {hintsShown < exercise.hints.length && (
                <Button size="sm" variant="ghost" icon={<Lightbulb className="size-4" />} onClick={() => setHintsShown((count) => count + 1)} className="self-start">
                  Show a hint
                </Button>
              )}
            </div>
          </Sheet>
        )}
        <Sheet title="Your attempts" padded={false}>
          {!submissions.data?.length ? (
            <p className="px-4 py-3 text-sm text-ink-muted">{runnable ? 'Each time you run the tests, the result is kept here.' : 'Editor-only languages are not run, so no attempts are recorded.'}</p>
          ) : (
            <ul className="divide-y divide-rule">
              {submissions.data.slice(0, 8).map((submission) => (
                <li key={submission.id}>
                  <button type="button" onClick={() => setCode(submission.code)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-sheet-2" title="Load this code into the editor">
                    {submission.passed ? <CheckCircle2 className="size-4 text-correct" aria-label="Passed" /> : <XCircle className="size-4 text-wrong" aria-label="Not passed" />}
                    <span className="tabular">
                      {submission.testsPassed} / {submission.testsTotal} tests
                    </span>
                    <span className="ml-auto text-xs text-ink-faint">{relativeTime(submission.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className={runnable ? 'text-sm text-ink-muted' : 'text-sm text-slip'}>{languageInfo(exercise.language).runtime}.</p>
        <Suspense fallback={<LoadingState label="Loading the editor…" />}>
          <CodeEditor value={code} onChange={setCode} language={exercise.language} onRun={() => void check()} label="Your solution" minHeight="18rem" maxHeight="60dvh" />
        </Suspense>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" icon={running ? undefined : <Play className="size-4" />} loading={running} onClick={() => void check()}>
            {runnable ? 'Run the tests' : 'Compare with my solution'}
          </Button>
          <Button variant="ghost" onClick={() => setCode(exercise.starterCode)}>
            Reset to starter code
          </Button>
          {running && (
            <span className="flex items-center gap-2 text-sm text-ink-muted">
              <Spinner /> {status ?? 'Running in the sandbox…'}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-wrong">{error}</p>}
        {judgement && <FeedbackPanel question={question} feedback={judgement.feedback} run={judgement.run} pendingSelfReview={false} onConfirmSelfReview={() => undefined} />}
      </div>
    </div>
  );
}

const parseLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const parseTags = (text: string) =>
  text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

function EditPanel({ exercise, onSaved, onDeleted, isNew }: { exercise: CustomExerciseRecord; onSaved: (saved: CustomExerciseRecord) => void; onDeleted: () => void; isNew: boolean }) {
  const { save, remove } = useExerciseMutations();
  const toast = useToast();
  const [draft, setDraft] = useState(exercise);
  const [hintsText, setHintsText] = useState(exercise.hints.join('\n'));
  const [tagsText, setTagsText] = useState(exercise.tags.join(', '));
  const [solutionCheck, setSolutionCheck] = useState<Judgement>();
  const [checking, setChecking] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const update = (patch: Partial<CustomExerciseRecord>) => setDraft((current) => ({ ...current, ...patch }));
  const complete = () => ({ ...draft, hints: parseLines(hintsText), tags: parseTags(tagsText) });

  const updateTest = (index: number, test: CodeTest) => update({ tests: draft.tests.map((current, position) => (position === index ? test : current)) });

  const checkSolution = async () => {
    setChecking(true);
    try {
      setSolutionCheck(await judgeResponse(exerciseQuestion(complete()), { type: 'code', code: draft.solution }));
    } finally {
      setChecking(false);
    }
  };

  const submit = async () => {
    const saved = await save.mutateAsync(complete());
    toast.show('Exercise saved', 'success');
    onSaved(saved);
  };

  const runnable = isRunnableLanguage(draft.language);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <Field label="Title">{(props) => <Input {...props} value={draft.title} onChange={(event) => update({ title: event.target.value })} required maxLength={120} />}</Field>
        <Field label="Language">
          {(props) => (
            <Select {...props} value={draft.language} onChange={(event) => update({ language: event.target.value as CodeLanguage })}>
              {EXERCISE_LANGUAGES.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                  {isRunnableLanguage(language.id) ? '' : ' (editor only)'}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Task (Markdown)">
        {(props) => <Textarea {...props} value={draft.prompt} onChange={(event) => update({ prompt: event.target.value })} rows={5} />}
      </Field>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-medium text-ink-muted">Starter code</span>
          <Suspense fallback={<LoadingState label="Loading the editor…" />}>
            <CodeEditor value={draft.starterCode} onChange={(starterCode) => update({ starterCode })} language={draft.language} label="Starter code" minHeight="10rem" />
          </Suspense>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-medium text-ink-muted">Your solution (shown after an attempt)</span>
          <Suspense fallback={<LoadingState label="Loading the editor…" />}>
            <CodeEditor value={draft.solution} onChange={(solution) => update({ solution })} language={draft.language} label="Solution" minHeight="10rem" />
          </Suspense>
        </div>
      </div>

      <Sheet
        title="Tests"
        aside={
          runnable ? (
            <Button size="sm" onClick={() => void checkSolution()} loading={checking} disabled={draft.tests.length === 0}>
              Check the solution passes
            </Button>
          ) : (
            <span>Not run for this language</span>
          )
        }
      >
        <div className="flex flex-col gap-3">
          {draft.tests.length === 0 && <p className="text-sm text-ink-muted">Without tests, practising this exercise means comparing your code with the solution.</p>}
          {draft.tests.map((test, index) => (
            <fieldset key={index} className="flex flex-col gap-2 rounded-md border border-rule p-3">
              <legend className="sr-only">Test {index + 1}</legend>
              <div className="flex items-center gap-2">
                <Input value={test.name} onChange={(event) => updateTest(index, { ...test, name: event.target.value })} placeholder="What this test checks" aria-label={`Test ${index + 1} name`} />
                <Select
                  value={test.kind}
                  onChange={(event) =>
                    updateTest(index, event.target.value === 'assert' ? { kind: 'assert', name: test.name, code: '' } : { kind: 'stdout', name: test.name, stdin: '', expected: '' })
                  }
                  aria-label={`Test ${index + 1} kind`}
                  className="w-40"
                >
                  <option value="assert">Assertion</option>
                  <option value="stdout">Printed output</option>
                </Select>
                <IconButton label={`Remove test ${index + 1}`} onClick={() => update({ tests: draft.tests.filter((_, position) => position !== index) })}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
              {test.kind === 'assert' ? (
                <Textarea
                  value={test.code}
                  onChange={(event) => updateTest(index, { ...test, code: event.target.value })}
                  rows={2}
                  placeholder={ASSERT_EXAMPLES[draft.language] ?? 'Code that fails when the answer is wrong'}
                  aria-label={`Test ${index + 1} assertion`}
                  className="font-code text-xs"
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Input (stdin)
                    <Textarea value={test.stdin} onChange={(event) => updateTest(index, { ...test, stdin: event.target.value })} rows={2} className="font-code text-xs" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-muted">
                    Expected output
                    <Textarea value={test.expected} onChange={(event) => updateTest(index, { ...test, expected: event.target.value })} rows={2} className="font-code text-xs" />
                  </label>
                </div>
              )}
            </fieldset>
          ))}
          <Button
            size="sm"
            icon={<Plus className="size-3.5" />}
            onClick={() => update({ tests: [...draft.tests, { kind: 'assert', name: `test ${draft.tests.length + 1}`, code: '' }] })}
            className="self-start"
          >
            Add test
          </Button>
          {solutionCheck && (
            <p className={solutionCheck.feedback.verdict === 'correct' ? 'text-sm text-correct' : 'text-sm text-wrong'}>
              {solutionCheck.feedback.verdict === 'correct'
                ? 'Your solution passes every test.'
                : `Your solution does not pass: ${solutionCheck.feedback.points.map((point) => point.message).join(' ')}`}
            </p>
          )}
        </div>
      </Sheet>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Hints (one per line)">{(props) => <Textarea {...props} value={hintsText} onChange={(event) => setHintsText(event.target.value)} rows={3} />}</Field>
        <Field label="Tags (comma separated)">{(props) => <Input {...props} value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="python, loops" />}</Field>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        <Button type="submit" variant="primary" loading={save.isPending}>
          Save exercise
        </Button>
        {!isNew && (
          <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setConfirmingDelete(true)} className="ml-auto">
            Delete exercise
          </Button>
        )}
      </div>

      <Dialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this exercise?"
        footer={
          <>
            <Button onClick={() => setConfirmingDelete(false)}>Keep it</Button>
            <Button variant="danger" onClick={() => remove.mutate(exercise.id, { onSuccess: onDeleted })} loading={remove.isPending}>
              Delete exercise
            </Button>
          </>
        }
      >
        <p className="px-4 py-3 text-sm">“{exercise.title}” and your attempts at it will be deleted.</p>
      </Dialog>
    </form>
  );
}
