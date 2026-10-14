/**
 * Settings: theme, study goals and review pacing, where data lives, backups, how code runs,
 * and where the course content comes from.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { type ThemePreference, useTheme } from '@/app/useTheme';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState, Kbd, LoadingState } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { PageHeader, Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/useToast';
import { backupFileName, parseBackup } from '@/data/backup';
import { learnerKeys, useLegacyNotes, useSaveSettings, useSettings } from '@/data/queries';
import type { BackupFile, LegacyNote, Settings } from '@/data/records';
import type { ImportMode } from '@/data/repository';
import { useRepository } from '@/data/useRepository';
import { useCatalog } from '@/domain/content/load';
import { AccountSheet } from '@/features/auth/AccountSheet';
import { LearnersSheet } from '@/features/learners/LearnersSheet';
import { useAuth } from '@/features/auth/useAuth';
import { dayKey, formatDate } from '@/lib/dates';
import { downloadText } from '@/lib/download';

export default function SettingsPage() {
  const settings = useSettings();
  if (settings.error) return <ErrorState title="Settings could not be loaded" error={settings.error} />;
  if (!settings.data) return <LoadingState />;
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Settings" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <AppearanceSheet />
          <GoalsSheet key={JSON.stringify(settings.data)} settings={settings.data} />
          <ShortcutsSheet />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <LearnersSheet />
          <StorageSheet />
          <BackupSheet />
          <LegacyNotesSheet />
          <ExecutionSheet />
          <ContentSheet />
        </div>
      </div>
    </div>
  );
}

function AppearanceSheet() {
  const { preference, setPreference } = useTheme();
  return (
    <Sheet title="Appearance">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Night is a low-glare graphite theme; Day is paper white.</p>
        <Segmented<ThemePreference>
          label="Theme"
          value={preference}
          onChange={setPreference}
          options={[
            { id: 'system', label: 'System' },
            { id: 'light', label: 'Day' },
            { id: 'dark', label: 'Night' },
          ]}
        />
      </div>
    </Sheet>
  );
}

const RETENTION_OPTIONS = [
  { value: 0.8, label: '80%: fewer reviews, more forgetting' },
  { value: 0.85, label: '85%' },
  { value: 0.9, label: '90%: recommended' },
  { value: 0.95, label: '95%: many more reviews' },
];

function GoalsSheet({ settings }: { settings: Settings }) {
  const save = useSaveSettings();
  const toast = useToast();
  const [draft, setDraft] = useState(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const number = (key: keyof Settings, min: number, max: number) => ({
    type: 'number' as const,
    min,
    max,
    required: true,
    value: draft[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setDraft((current) => ({ ...current, [key]: Number(event.target.value) })),
  });

  return (
    <Sheet title="Study goals and reviews">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(draft, { onSuccess: () => toast.show('Settings saved', 'success') });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Daily goal: minutes">{(props) => <Input {...props} {...number('dailyGoalMinutes', 5, 600)} />}</Field>
          <Field label="Daily goal: questions">{(props) => <Input {...props} {...number('dailyGoalQuestions', 5, 500)} />}</Field>
        </div>
        <p className="-mt-2 text-xs text-ink-faint">A day counts as met when either goal is reached.</p>
        <Field label="Reviews per session" hint="The most due reviews offered in one session; the rest wait for the next.">
          {(props) => <Input {...props} {...number('reviewSessionSize', 5, 200)} />}
        </Field>
        <Field label="Target recall" hint="How likely you should be to remember an item when it comes due. Higher means shorter intervals and more reviews.">
          {(props) => (
            <Select {...props} value={draft.desiredRetention} onChange={(event) => setDraft((current) => ({ ...current, desiredRetention: Number(event.target.value) }))}>
              {RETENTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button type="submit" variant="primary" disabled={!dirty} loading={save.isPending} className="self-start">
          Save settings
        </Button>
      </form>
    </Sheet>
  );
}

function ShortcutsSheet() {
  const shortcuts: Array<[string[], string]> = [
    [['Ctrl', 'K'], 'Search courses, lessons, words and certifications'],
    [['Enter'], 'Check a typed answer'],
    [['1', '…', '9'], 'Choose an option on an answer sheet'],
    [['Ctrl', 'Enter'], 'Run code, or check a long answer'],
  ];
  return (
    <Sheet title="Keyboard shortcuts">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 text-sm">
        {shortcuts.map(([keys, action]) => (
          <div key={action} className="contents">
            <dt className="flex gap-1">
              {keys.map((key) => (key === '…' ? <span key={key} className="text-ink-faint">…</span> : <Kbd key={key}>{key}</Kbd>))}
            </dt>
            <dd className="text-ink-muted">{action}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}

function StorageSheet() {
  return useAuth().status === 'local' ? <LocalStorage /> : <AccountSheet />;
}

function LocalStorage() {
  const [persisted, setPersisted] = useState<boolean>();
  const [usage, setUsage] = useState<string>();

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted);
    void navigator.storage?.estimate?.().then(({ usage: bytes }) => {
      if (bytes !== undefined) setUsage(`${(bytes / 1_048_576).toFixed(1)} MB`);
    });
  }, []);

  return (
    <Sheet title="Where your data lives">
      <div className="flex flex-col gap-3 text-sm">
        <p>
          Each learner&apos;s progress, calendar and code are stored <strong>in this browser only</strong> (IndexedDB). Nothing is sent to a server. Clearing this site&apos;s data, or using
          another browser, starts from empty, so export a backup now and then.
        </p>
        <p className="text-ink-muted">
          {usage && <>Using {usage}. </>}
          {persisted === true && 'The browser has agreed to keep this data even when storage runs low.'}
          {persisted === false && 'The browser may clear this data when storage runs low.'}
        </p>
        {persisted === false && (
          <Button size="sm" onClick={() => void navigator.storage.persist().then(setPersisted)} className="self-start">
            Ask the browser to keep my data
          </Button>
        )}
        <p className="text-xs text-ink-faint">To sync between devices, connect Supabase: see docs/SUPABASE.md.</p>
      </div>
    </Sheet>
  );
}

function BackupSheet() {
  const repository = useRepository();
  const client = useQueryClient();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [pending, setPending] = useState<BackupFile>();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string>();

  const exportBackup = async () => {
    setExporting(true);
    try {
      downloadText(backupFileName(), JSON.stringify(await repository.exportAll(), null, 1), 'application/json');
    } finally {
      setExporting(false);
    }
  };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(undefined);
    try {
      setPending(parseBackup(await file.text()));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const runImport = async (mode: ImportMode) => {
    if (!pending) return;
    setImporting(true);
    try {
      await repository.importAll(pending, mode);
      await client.invalidateQueries({ queryKey: learnerKeys.all });
      toast.show(mode === 'replace' ? 'Backup restored' : 'Backup merged into your data', 'success');
      setPending(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Sheet title="Backups">
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-muted">A backup is one JSON file with the current learner’s answers, progress, calendar, code, unfinished exams and settings. It also moves a learner’s data between browsers or into an account.</p>
        <div className="flex flex-wrap gap-2">
          <Button icon={<Download className="size-4" />} onClick={() => void exportBackup()} loading={exporting}>
            Export backup
          </Button>
          <Button icon={<Upload className="size-4" />} onClick={() => fileInput.current?.click()}>
            Import backup
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void chooseFile(event)} aria-label="Backup file" />
        </div>
        {error && (
          <p role="alert" className="text-wrong">
            {error}
          </p>
        )}
      </div>

      <Dialog
        open={Boolean(pending)}
        onClose={() => setPending(undefined)}
        title="Import this backup?"
        footer={
          <>
            <Button onClick={() => setPending(undefined)}>Cancel</Button>
            <Button onClick={() => void runImport('merge')} loading={importing}>
              Merge with my data
            </Button>
            <Button variant="danger" onClick={() => void runImport('replace')} loading={importing}>
              Replace my data
            </Button>
          </>
        }
      >
        {pending && (
          <div className="flex flex-col gap-2 px-4 py-3 text-sm">
            <p>
              Backup from {formatDate(pending.exportedAt)}: {pending.attempts.length} answers, {pending.importantDates.length} important dates, {pending.codeProjects.length} code projects,{' '}
              {pending.reviewStates.length} scheduled reviews.
            </p>
            <p className="text-ink-muted">
              <strong>Merge</strong> adds the backup and overwrites records that exist in both. <strong>Replace</strong> deletes everything you have now first.
            </p>
          </div>
        )}
      </Dialog>
    </Sheet>
  );
}

/** Notes from the notebook that was removed: shown only while some remain, to download or delete. */
function LegacyNotesSheet() {
  const repository = useRepository();
  const client = useQueryClient();
  const notes = useLegacyNotes();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => repository.deleteLegacyNotes(),
    onSuccess: () => {
      setConfirming(false);
      void client.invalidateQueries({ queryKey: learnerKeys.legacyNotes });
    },
  });
  if (!notes.data?.length) return null;

  const count = `${notes.data.length} note${notes.data.length === 1 ? '' : 's'}`;
  return (
    <Sheet title="Notes from the old notebook">
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-muted">
          The notebook has been replaced by the calendar. You still have {count} from it: download them as one Markdown file to keep them, then delete them here.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<Download className="size-4" />} onClick={() => downloadText(`study-hub-notes-${dayKey()}.md`, notesAsMarkdown(notes.data), 'text/markdown')}>
            Download {count}
          </Button>
          {confirming ? (
            <>
              <span className="text-ink-muted">Delete them for good?</span>
              <Button variant="danger" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Keep
              </Button>
            </>
          ) : (
            <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirming(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function notesAsMarkdown(notes: LegacyNote[]): string {
  return notes.map((note) => `# ${note.title || 'Untitled note'}\n\n_Last edited ${formatDate(note.updatedAt)}_\n\n${note.body.trim()}\n`).join('\n---\n\n');
}

function ExecutionSheet() {
  return (
    <Sheet title="Running code">
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink-muted">
        <li>Python, JavaScript, TypeScript and SQL run in isolated Web Workers inside this browser, never on a server, with a time limit for every run.</li>
        <li>
          The workers have no access to the page or to your stored data, and their network access is blocked except for Python&apos;s runtime (Pyodide, about 10 MB) and its
          packages, downloaded from cdn.jsdelivr.net the first time they are needed.
        </li>
        <li>C, Java and Bash are editor-only: they are saved and can be compared with solutions, but they are never run, and Study Hub never reports them as tested.</li>
      </ul>
    </Sheet>
  );
}

function ContentSheet() {
  const catalog = useCatalog();
  const fromBooks = catalog.data?.courses.filter((course) => course.origin === 'user-material').length ?? 0;
  return (
    <Sheet title="Course content">
      <div className="flex flex-col gap-2 text-sm text-ink-muted">
        {catalog.data && (
          <p>
            {catalog.data.courses.length} courses ({fromBooks} from your own books) and {catalog.data.certifications.length} certifications, built {formatDate(catalog.data.generatedAt)}.
          </p>
        )}
        <p>
          Lessons from your HSK and JLPT books are generated on this computer from your own files, for your personal study. They are kept out of the source repository and must not be
          published.
        </p>
      </div>
    </Sheet>
  );
}
