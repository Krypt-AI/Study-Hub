/** Code and SQL answers: the editor, the language, and whether the code can actually be run. */
import { lazy, Suspense, useState } from 'react';
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react';
import { LoadingState, Tag } from '@/components/ui/Feedback';
import type { CodeQuestion, SqlQuestion } from '@/domain/content/types';
import { RUNNABLE_LANGUAGES } from '@/features/playground/execution/codeRunner';
import { languageInfo } from '@/features/playground/languages';

const CodeEditor = lazy(() => import('@/components/CodeEditor'));

export interface CodeAnswerInputProps {
  question: CodeQuestion | SqlQuestion;
  code: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CodeAnswerInput({ question, code, onChange, onSubmit, disabled = false }: CodeAnswerInputProps) {
  const language = question.type === 'sql' ? 'sql' : question.language;
  const runnable = RUNNABLE_LANGUAGES.has(language);
  const [showSchema, setShowSchema] = useState(false);
  const testCount = question.type === 'code' ? question.tests.length : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Tag title={languageInfo(language).runtime}>{languageInfo(language).name}</Tag>
        {runnable ? (
          <span>{question.type === 'sql' ? 'Runs on a fresh copy of the practice database.' : `Checked by ${testCount} test${testCount === 1 ? '' : 's'} in the sandbox.`}</span>
        ) : (
          <span className="flex items-center gap-1.5 text-slip">
            <TriangleAlert className="size-3.5" aria-hidden /> Editor only: this language cannot be run in Study Hub yet.
          </span>
        )}
        <span className="ml-auto text-xs text-ink-faint">Ctrl + Enter to {runnable ? 'run' : 'check'}</span>
      </div>
      {question.type === 'sql' && (
        <div>
          <button type="button" onClick={() => setShowSchema((value) => !value)} className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            {showSchema ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />} Database tables
          </button>
          {showSchema && (
            <pre className="mt-2 max-h-56 overflow-auto rounded-md border border-rule bg-sheet-2 p-3 font-code text-xs leading-relaxed text-ink-muted">
              {question.schema.split('\n').filter((line) => /CREATE TABLE/iu.test(line)).join('\n')}
            </pre>
          )}
        </div>
      )}
      <Suspense fallback={<LoadingState label="Loading the editor…" className="py-6" />}>
        <CodeEditor value={code} onChange={onChange} language={language} onRun={disabled ? undefined : onSubmit} readOnly={disabled} label="Your code" minHeight="9rem" />
      </Suspense>
    </div>
  );
}
