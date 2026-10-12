/** Renderers for each kind of lesson block. */
import { BookOpenText, ExternalLink, Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { PageImage } from '@/components/media/PageImage';
import { Markdown } from '@/components/Markdown';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Feedback';
import { describeFlag, REASSURING_FLAGS } from '@/domain/content/flags';
import type { Block } from '@/domain/content/types';
import { cn } from '@/lib/cn';
import { PageViewer } from './PageViewer';

const LANG_ATTR = { zh: 'zh-CN', ja: 'ja', en: 'en' } as const;

export function LessonBlock({ block, sourceTitle }: { block: Block; sourceTitle?: string }) {
  switch (block.kind) {
    case 'markdown':
      return <Markdown>{block.body}</Markdown>;
    case 'callout':
      return <Callout tone={block.tone} title={block.title} body={block.body} />;
    case 'vocab':
      return <VocabularyTable block={block} />;
    case 'dialogue':
      return (
        <figure className="flex flex-col gap-2">
          {block.title && <figcaption className="font-display text-lg font-semibold">{block.title}</figcaption>}
          <ol className="flex flex-col gap-2" lang={LANG_ATTR[block.language]}>
            {block.lines.map((line, index) => (
              <li key={index} className="flex gap-3">
                {line.speaker && <span className="w-10 shrink-0 font-medium text-print">{line.speaker}</span>}
                <span className="flex flex-col">
                  {line.reading && <span className="text-sm text-ink-faint">{line.reading}</span>}
                  <span className="text-lg">{line.text}</span>
                  {line.translation && <span className="text-sm text-ink-muted" lang="en">{line.translation}</span>}
                </span>
              </li>
            ))}
          </ol>
        </figure>
      );
    case 'grammar':
      return (
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">{block.title}</h3>
          {block.body && <Markdown>{block.body}</Markdown>}
          {block.examples.length > 0 && (
            <ul className="flex flex-col gap-1.5" lang={LANG_ATTR[block.language]}>
              {block.examples.map((example, index) => (
                <li key={index}>
                  <span className="text-lg">{example.text}</span>
                  {example.reading && <span className="ml-2 text-sm text-ink-faint">{example.reading}</span>}
                  {example.translation && (
                    <span className="block text-sm text-ink-muted" lang="en">
                      {example.translation}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    case 'resources':
      return (
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold">{block.title ?? 'Resources'}</h3>
          <ul className="flex flex-col divide-y divide-rule rounded-md border border-rule">
            {block.items.map((item) => (
              <li key={item.url} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <a href={item.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 font-medium text-print-strong hover:underline">
                  {item.title} <ExternalLink className="size-3.5" aria-hidden />
                </a>
                {item.official && <Tag tone="print">Official</Tag>}
                {item.free === true && <Tag tone="correct">Free</Tag>}
                {item.free === false && <Tag>Paid</Tag>}
                {item.description && <span className="w-full text-sm text-ink-muted">{item.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      );
    case 'code':
      return (
        <figure>
          <Markdown>{`\`\`\`${block.language}\n${block.code}\n\`\`\``}</Markdown>
          {block.caption && <figcaption className="text-sm text-ink-muted">{block.caption}</figcaption>}
        </figure>
      );
    case 'source-pages':
      return <SourcePages sourceId={block.sourceId} pages={block.pages} caption={block.caption} title={sourceTitle ?? 'Your book'} />;
  }
}

function Callout({ tone, title, body }: { tone: 'info' | 'tip' | 'warning'; title?: string; body: string }) {
  const Icon = tone === 'tip' ? Lightbulb : tone === 'warning' ? TriangleAlert : Info;
  return (
    <aside className={cn('flex gap-3 rounded-md px-4 py-3', tone === 'warning' ? 'bg-slip-soft' : 'bg-print-soft')}>
      <Icon className={cn('mt-1 size-4 shrink-0', tone === 'warning' ? 'text-slip' : 'text-print')} aria-hidden />
      <div>
        {title && <p className="font-medium">{title}</p>}
        <Markdown compact>{body}</Markdown>
      </div>
    </aside>
  );
}

function VocabularyTable({ block }: { block: Extract<Block, { kind: 'vocab' }> }) {
  const [hideReading, setHideReading] = useState(false);
  const [hideMeaning, setHideMeaning] = useState(false);
  const [viewer, setViewer] = useState<{ sourceId: string; page: number } | undefined>();
  const cover = 'select-none bg-sheet-2 text-transparent hover:bg-transparent hover:text-inherit transition-colors';

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">
          {block.title ?? 'Vocabulary'} <span className="tabular text-sm font-normal text-ink-faint">{block.items.length}</span>
        </h3>
        <div className="flex gap-1.5">
          <Button size="sm" variant={hideReading ? 'primary' : 'secondary'} aria-pressed={hideReading} onClick={() => setHideReading((value) => !value)}>
            Cover readings
          </Button>
          <Button size="sm" variant={hideMeaning ? 'primary' : 'secondary'} aria-pressed={hideMeaning} onClick={() => setHideMeaning((value) => !value)}>
            Cover meanings
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-rule">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-print-line text-ink-muted">
              <th className="w-10 px-3 py-2 font-display font-semibold">#</th>
              <th className="px-3 py-2 font-display font-semibold">Word</th>
              <th className="px-3 py-2 font-display font-semibold">Reading</th>
              <th className="px-3 py-2 font-display font-semibold">Meaning</th>
              <th className="w-10 px-3 py-2">
                <span className="sr-only">Source page</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {block.items.map((item, index) => {
              const warnings = item.source?.flags.filter((flag) => !REASSURING_FLAGS.has(flag) && flag !== 'no-part-of-speech') ?? [];
              return (
                <tr key={item.id} className="border-b border-rule align-top last:border-b-0 hover:bg-sheet-2/60">
                  <td className="display-numerals px-3 py-2 text-print">{index + 1}</td>
                  <td className="px-3 py-2 text-xl whitespace-nowrap" lang={LANG_ATTR[block.language]}>
                    {item.term}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" lang={block.language === 'ja' ? 'ja' : undefined}>
                    <span className={cn('rounded px-1', hideReading && cover)}>{item.reading}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('rounded px-1', hideMeaning && cover)}>
                      {item.partOfSpeech && <span className="mr-1.5 text-ink-faint italic">{item.partOfSpeech}</span>}
                      {item.meaning}
                    </span>
                    {item.notes && <span className="mt-0.5 block text-xs text-ink-faint">{item.notes}</span>}
                    {warnings.length > 0 && <span className="mt-0.5 block text-xs text-slip">{warnings.map(describeFlag).join(' · ')}</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    {item.source?.sourceId && item.source.page && (
                      <button
                        type="button"
                        onClick={() => setViewer({ sourceId: item.source!.sourceId!, page: item.source!.page! })}
                        title={`Open page ${item.source.page}`}
                        aria-label={`Open the book page for ${item.term}`}
                        className="rounded p-1 text-ink-faint hover:bg-sheet-2 hover:text-print"
                      >
                        <BookOpenText className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {viewer && (
        <PageViewer sourceId={viewer.sourceId} title="Vocabulary index" pages={[viewer.page]} startPage={viewer.page} open onClose={() => setViewer(undefined)} />
      )}
    </section>
  );
}

function SourcePages({ sourceId, pages, caption, title }: { sourceId: string; pages: number[]; caption?: string; title: string }) {
  const [open, setOpen] = useState<number | undefined>();
  const preview = pages.slice(0, 8);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">Original pages</h3>
        {caption && <p className="text-sm text-ink-muted">{caption}</p>}
      </div>
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {preview.map((page) => (
          <li key={page}>
            <button type="button" onClick={() => setOpen(page)} className="group block w-full text-left" aria-label={`Open page ${page}`}>
              <PageImage sourceId={sourceId} page={page} className="transition-colors group-hover:border-print" />
              <span className="tabular mt-1 block text-center text-xs text-ink-faint">p.{page}</span>
            </button>
          </li>
        ))}
      </ol>
      {pages.length > preview.length && (
        <Button size="sm" variant="ghost" onClick={() => setOpen(pages[preview.length])} className="self-start">
          {pages.length - preview.length} more pages
        </Button>
      )}
      <PageViewer sourceId={sourceId} title={title} pages={pages} startPage={open ?? pages[0] ?? 1} open={open !== undefined} onClose={() => setOpen(undefined)} />
    </section>
  );
}
