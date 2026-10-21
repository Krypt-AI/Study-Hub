/**
 * The playground: code projects with an editor, stdin, sandboxed runs, saved versions and
 * autosave, plus the exercises you write for yourself. Python, JavaScript, TypeScript and
 * SQL run in isolated Web Workers in the browser; C, Java and Bash are labelled editor-only and
 * are never reported as run.
 */
import { ChevronLeft, Download, History, Play, Plus, Square, Trash2, TriangleAlert } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ResultTable } from '@/components/ResultTable';
import { Button, IconButton, Spinner } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, LoadingState, Tag } from '@/components/ui/Feedback';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/useToast';
import { useCodeProjects, useCodeVersions, useCustomExercises } from '@/data/queries';
import type { CodeProjectRecord, CustomExerciseRecord } from '@/data/records';
import type { CodeLanguage } from '@/domain/content/types';
import { exerciseUrl, projectUrl } from '@/domain/content/urls';
import { SaveStatusText } from '@/components/SaveStatusText';
import { useAutosave } from '@/lib/useAutosave';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/dates';
import { downloadText, fileSlug } from '@/lib/download';
import { newId } from '@/lib/ids';
import type { RunResponse } from '@/workers/protocol';
import { codeRunner, isRunnableLanguage } from './execution/codeRunner';
import { LANGUAGES, languageInfo } from './languages';
import { newProject, useProjectMutations } from './usePlaygroundMutations';

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

const RUN_TIMEOUT_MS = 10_000;

export default function PlaygroundPage() {
  const { projectId } = useParams();
  const projects = useCodeProjects();
  const exercises = useCustomExercises();
  const navigate = useNavigate();
  const { save } = useProjectMutations();

  if (projects.error || exercises.error) return <ErrorState title="Your code could not be loaded" error={projects.error ?? exercises.error} />;
  if (!projects.data || !exercises.data) return <LoadingState />;

  const create = async (language: CodeLanguage) => {
    const project = await save.mutateAsync(newProject(language));
    void navigate(projectUrl(project.id));
  };
  const project = projectId ? projects.data.find((candidate) => candidate.id === projectId) : undefined;

  return (
    <div className="mx-auto max-w-[96rem]">
      <h1 className="sr-only">Playground</h1>
      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar projects={projects.data} exercises={exercises.data} activeId={projectId} onCreate={(language) => void create(language)} className={projectId ? 'hidden lg:flex' : 'flex'} />
        <section aria-label="Workspace" className={cn('min-w-0 flex-col', projectId ? 'flex' : 'hidden lg:flex')}>
          {project ? (
            <Workspace key={project.id} project={project} />
          ) : projectId ? (
            <EmptyState title="This project no longer exists" action={<Link to="/playground">Back to the playground</Link>}>
              It may have been deleted.
            </EmptyState>
          ) : (
            <Welcome onCreate={(language) => void create(language)} />
          )}
        </section>
      </div>
    </div>
  );
}

function Sidebar({
  projects,
  exercises,
  activeId,
  onCreate,
  className,
}: {
  projects: CodeProjectRecord[];
  exercises: CustomExerciseRecord[];
  activeId?: string;
  onCreate: (language: CodeLanguage) => void;
  className?: string;
}) {
  const [choosing, setChoosing] = useState(false);
  const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <aside aria-label="Projects and exercises" className={cn('flex-col gap-5', className)}>
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Projects</h2>
          <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => setChoosing(true)}>
            New
          </Button>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-muted">No projects yet.</p>
        ) : (
          <ul className="flex flex-col overflow-hidden rounded-md border border-rule bg-sheet">
            {sorted.map((project) => (
              <li key={project.id} className="border-b border-rule last:border-b-0">
                <Link
                  to={projectUrl(project.id)}
                  aria-current={project.id === activeId ? 'page' : undefined}
                  className={cn('flex flex-col gap-0.5 border-l-2 px-3 py-2', project.id === activeId ? 'border-print bg-sheet-2' : 'border-transparent hover:bg-sheet-2')}
                >
                  <span className="truncate text-sm font-medium">{project.title}</span>
                  <span className="flex items-center gap-2 text-xs text-ink-faint">
                    {languageInfo(project.language).name} · {relativeTime(project.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">My exercises</h2>
          <Link to={exerciseUrl('new')} className="text-sm text-print-strong hover:underline">
            New exercise
          </Link>
        </div>
        {exercises.length === 0 ? (
          <p className="text-sm text-ink-muted">Write your own exercises with tests and practise them here.</p>
        ) : (
          <ul className="flex flex-col">
            {exercises.map((exercise) => (
              <li key={exercise.id}>
                <Link to={exerciseUrl(exercise.id)} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sheet-2">
                  <span className="min-w-0 truncate">{exercise.title}</span>
                  <span className="shrink-0 text-xs text-ink-faint">{languageInfo(exercise.language).name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={choosing} onClose={() => setChoosing(false)} title="New project">
        <LanguageList
          onChoose={(language) => {
            setChoosing(false);
            onCreate(language);
          }}
        />
      </Dialog>
    </aside>
  );
}

function LanguageList({ onChoose }: { onChoose: (language: CodeLanguage) => void }) {
  return (
    <ul className="divide-y divide-rule">
      {LANGUAGES.map((language) => (
        <li key={language.id}>
          <button type="button" onClick={() => onChoose(language.id)} className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-sheet-2">
            <span className="flex items-center gap-2 font-medium">
              {language.name}
              {!isRunnableLanguage(language.id) && <Tag tone="slip">editor only</Tag>}
            </span>
            <span className="text-sm text-ink-muted">{language.runtime}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Welcome({ onCreate }: { onCreate: (language: CodeLanguage) => void }) {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-[1.75rem] leading-tight font-semibold">Playground</h2>
        <p className="mt-1.5 max-w-[68ch] text-ink-muted">
          Write and run small programs. Code runs in an isolated worker inside your browser, never on a server, with a time limit and no network access beyond the runtime itself.
        </p>
      </div>
      <section className="rounded-md border border-rule bg-sheet">
        <h3 className="border-b border-rule px-4 py-2 font-semibold">Start a project</h3>
        <LanguageList onChoose={onCreate} />
      </section>
    </div>
  );
}

function Workspace({ project }: { project: CodeProjectRecord }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { save, remove, saveVersion, recordRun } = useProjectMutations();
  const [draft, setDraft] = useState(project);
  const autosave = useAutosave(draft, (value) => save.mutateAsync(value));
  const [run, setRun] = useState<RunResponse>();
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string>();
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const info = languageInfo(draft.language);
  const runnable = isRunnableLanguage(draft.language);

  const execute = async () => {
    const { language } = draft;
    if (!isRunnableLanguage(language) || running) return;
    setRunning(true);
    setRunStatus(undefined);
    try {
      setRun(await codeRunner.run({ id: newId(), language, code: draft.code, stdin: draft.stdin }, { timeoutMs: RUN_TIMEOUT_MS, onStatus: setRunStatus }));
      recordRun.mutate();
    } finally {
      setRunning(false);
      setRunStatus(undefined);
    }
  };

  const changeLanguage = (language: CodeLanguage) => {
    // Untouched starter code follows the language; anything the learner wrote is kept.
    const untouched = draft.code === info.starter;
    const next = languageInfo(language);
    setDraft((current) => ({ ...current, language, code: untouched ? next.starter : current.code, stdin: untouched ? (next.starterStdin ?? '') : current.stdin }));
    setRun(undefined);
  };

  const deleteProject = () => {
    autosave.discard();
    void navigate('/playground');
    remove.mutate(project.id);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Link to="/playground" className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink lg:hidden">
        <ChevronLeft className="size-4" aria-hidden /> Projects
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          aria-label="Project title"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 font-display text-2xl font-semibold hover:border-rule focus:border-print focus:outline-none"
        />
        <Select value={draft.language} onChange={(event) => changeLanguage(event.target.value as CodeLanguage)} aria-label="Language" className="w-44">
          {LANGUAGES.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </Select>
        {runnable &&
          (running ? (
            <Button icon={<Square className="size-3.5" />} onClick={() => isRunnableLanguage(draft.language) && codeRunner.stop(draft.language)}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" icon={<Play className="size-4" />} onClick={() => void execute()}>
              Run
            </Button>
          ))}
        <IconButton label="Versions" onClick={() => setVersionsOpen(true)}>
          <History className="size-4" />
        </IconButton>
        <IconButton label={`Download as .${info.extension}`} onClick={() => downloadText(`${fileSlug(draft.title, 'program')}.${info.extension}`, draft.code)}>
          <Download className="size-4" />
        </IconButton>
        <IconButton label="Delete project" onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {runnable ? (
          <span className="text-ink-muted">{info.runtime}. Ctrl + Enter runs; each run stops after {RUN_TIMEOUT_MS / 1000} s.</span>
        ) : (
          <span className="flex items-center gap-1.5 text-slip">
            <TriangleAlert className="size-4" aria-hidden /> {info.runtime}. Your code is saved, versioned and exportable, but it is not executed.
          </span>
        )}
        <span className="ml-auto">
          <SaveStatusText status={autosave.status} savedAt={autosave.savedAt} />
        </span>
      </div>

      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Suspense fallback={<LoadingState label="Loading the editor…" />}>
          <CodeEditor
            value={draft.code}
            onChange={(code) => setDraft((current) => ({ ...current, code }))}
            language={draft.language}
            onRun={runnable ? () => void execute() : undefined}
            label="Program code"
            minHeight="22rem"
            maxHeight="68dvh"
          />
        </Suspense>
        <div className="flex min-w-0 flex-col gap-3">
          {runnable && draft.language !== 'sql' && (
            <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
              Input (stdin), one line per input() call
              <Textarea value={draft.stdin} onChange={(event) => setDraft((current) => ({ ...current, stdin: event.target.value }))} rows={3} className="font-code text-xs" />
            </label>
          )}
          {runnable && <OutputPanel run={run} running={running} status={runStatus} />}
        </div>
      </div>

      <VersionsDialog
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        projectId={project.id}
        code={draft.code}
        onSave={(label) => saveVersion.mutate({ projectId: project.id, code: draft.code, label }, { onSuccess: () => toast.show('Version saved', 'success') })}
        onRestore={(code) => {
          if (code !== draft.code) saveVersion.mutate({ projectId: project.id, code: draft.code, label: 'Before restoring' });
          setDraft((current) => ({ ...current, code }));
          setVersionsOpen(false);
          toast.show('Version restored. Your previous code was saved as a version.', 'success');
        }}
      />

      <Dialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this project?"
        footer={
          <>
            <Button onClick={() => setConfirmingDelete(false)}>Keep it</Button>
            <Button variant="danger" onClick={deleteProject}>
              Delete project
            </Button>
          </>
        }
      >
        <p className="px-4 py-3 text-sm">“{draft.title}” and all its saved versions will be deleted.</p>
      </Dialog>
    </div>
  );
}

function OutputPanel({ run, running, status }: { run?: RunResponse; running: boolean; status?: string }) {
  const failed = run && (run.status !== 'ok' || Boolean(run.error));
  return (
    <section aria-label="Output" className="flex min-h-56 flex-col rounded-md border border-rule bg-sheet">
      <header className="flex items-center gap-2 border-b border-rule px-3 py-1.5">
        <h2 className="font-display text-sm font-semibold">Output</h2>
        {run && !running && <Tag tone={run.status === 'timeout' ? 'slip' : failed ? 'wrong' : 'correct'}>{run.status === 'timeout' ? 'stopped: time limit' : failed ? 'error' : 'finished'}</Tag>}
        {run && !running && <span className="tabular ml-auto text-xs text-ink-faint">{Math.round(run.durationMs)} ms</span>}
      </header>
      <div className="max-h-[60dvh] flex-1 overflow-auto p-3" aria-live="polite">
        {running ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner /> {status ?? 'Running in the sandbox…'}
          </p>
        ) : !run ? (
          <p className="text-sm text-ink-faint">Run the program to see its output here.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {run.stdout && <pre className="font-code text-xs whitespace-pre-wrap text-ink">{run.stdout}</pre>}
            {run.stderr && <pre className="font-code text-xs whitespace-pre-wrap text-wrong">{run.stderr}</pre>}
            {run.error && <pre className="font-code text-xs whitespace-pre-wrap text-wrong">{run.error}</pre>}
            {run.tables?.map((table, index) => <ResultTable key={index} table={table} caption={`Result ${index + 1}`} />)}
            {!run.stdout && !run.stderr && !run.error && !run.tables?.length && <p className="text-sm text-ink-faint">The program finished without printing anything.</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function VersionsDialog({
  open,
  onClose,
  projectId,
  code,
  onSave,
  onRestore,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  code: string;
  onSave: (label?: string) => void;
  onRestore: (code: string) => void;
}) {
  const versions = useCodeVersions(open ? projectId : undefined);
  const [label, setLabel] = useState('');
  return (
    <Dialog open={open} onClose={onClose} title="Versions" className="w-[min(40rem,calc(100vw-2rem))]">
      <form
        className="flex gap-2 border-b border-rule px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(label.trim() || undefined);
          setLabel('');
        }}
      >
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label (optional), e.g. working solution" aria-label="Version label" />
        <Button type="submit" variant="primary">
          Save current code
        </Button>
      </form>
      {versions.isLoading ? (
        <LoadingState />
      ) : !versions.data?.length ? (
        <p className="px-4 py-4 text-sm text-ink-muted">No saved versions yet. Save one before a big change so you can go back.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {versions.data.map((version) => (
            <li key={version.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{version.label ?? 'Saved version'}</p>
                <p className="text-xs text-ink-faint">
                  {relativeTime(version.createdAt)} · {version.code.split('\n').length} lines{version.code === code ? ' · same as now' : ''}
                </p>
              </div>
              <Button size="sm" onClick={() => onRestore(version.code)} disabled={version.code === code}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
