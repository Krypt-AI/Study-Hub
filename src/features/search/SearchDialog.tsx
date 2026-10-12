/** Global search (Ctrl/Cmd + K): courses, lessons, vocabulary, questions, certifications and code. */
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Field';
import { LoadingState, Tag } from '@/components/ui/Feedback';
import { useCodeProjects } from '@/data/queries';
import { useSearchDocuments } from '@/domain/content/load';
import { projectUrl } from '@/domain/content/urls';
import { canOpenMembersContent, useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/cn';
import { createSearchIndex, type SearchEntry, type SearchKind } from './searchIndex';

const KIND_LABELS: Record<SearchKind, string> = {
  course: 'Course',
  lesson: 'Lesson',
  question: 'Question',
  vocab: 'Word',
  certification: 'Certification',
  project: 'Code',
};

function useSearch(enabled: boolean) {
  const documents = useSearchDocuments(enabled, canOpenMembersContent(useAuth()));
  const projects = useCodeProjects();
  const index = useMemo(() => {
    if (!documents.data) return undefined;
    const entries: SearchEntry[] = [
      ...documents.data.map((document) => ({ id: document.id, kind: document.kind, title: document.title, text: document.text, url: document.url })),
      ...(projects.data ?? []).map((project) => ({ id: `project:${project.id}`, kind: 'project' as const, title: project.title, text: `${project.description} ${project.code}`, url: projectUrl(project.id) })),
    ];
    return createSearchIndex(entries);
  }, [documents.data, projects.data]);
  return { index, isLoading: documents.isLoading, error: documents.error };
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { index, isLoading, error } = useSearch(open);

  const results = useMemo(() => (index && query.trim() ? index.search(query).slice(0, 30) : []), [index, query]);

  const go = (url: string) => {
    onClose();
    setQuery('');
    navigate(url);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Search" hideTitle className="mt-[12dvh] mb-auto">
      <div className="border-b border-print-line p-3">
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            } else if (event.key === 'Enter' && results[active]) {
              go(String(results[active].url));
            }
          }}
          placeholder="Search lessons, words (汉字, かな, pinyin), questions, code…"
          aria-label="Search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          className="h-11 text-base"
        />
      </div>
      <div className="max-h-[55dvh] overflow-y-auto p-2" id="search-results" role="listbox" aria-label="Results">
        {isLoading && <LoadingState label="Loading the search index…" className="py-6 px-2" />}
        {error && <p className="px-2 py-4 text-sm text-wrong">The search index is missing. Run `npm run content:build`.</p>}
        {!isLoading && query.trim() && results.length === 0 && <p className="px-2 py-4 text-sm text-ink-muted">Nothing matches “{query}”.</p>}
        {!query.trim() && !isLoading && <p className="px-2 py-4 text-sm text-ink-faint">Type to search everything. ↑ ↓ to move, Enter to open.</p>}
        {results.map((result, position) => (
          <button
            key={result.id}
            type="button"
            role="option"
            aria-selected={position === active}
            onMouseEnter={() => setActive(position)}
            onClick={() => go(String(result.url))}
            className={cn('flex w-full items-start gap-3 rounded-md px-2.5 py-2 text-left', position === active ? 'bg-sheet-2' : 'hover:bg-sheet-2')}
          >
            <Tag tone={result.kind === 'project' ? 'print' : 'neutral'} className="mt-0.5 w-20 justify-center">
              {KIND_LABELS[result.kind as SearchKind]}
            </Tag>
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">{String(result.title)}</span>
              {result.text && <span className="block truncate text-xs text-ink-muted">{String(result.text).slice(0, 140)}</span>}
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
