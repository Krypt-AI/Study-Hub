/**
 * Markdown renderer for lessons and explanations (GFM tables, task lists, highlighted
 * code, "mindmap" blocks). Syntax colours come from the palette in global.css, not a stock highlight theme.
 */
import { type ComponentProps, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { headingId } from '@/domain/content/headings';
import { cn } from '@/lib/cn';
import { MindMap } from './MindMap';

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [[rehypeHighlight, { detect: false, ignoreMissing: true, plainText: ['mindmap'] }]] as ComponentProps<typeof ReactMarkdown>['rehypePlugins'];

export interface MarkdownProps {
  children: string;
  className?: string;
  /** Compact typography for prompts, feedback and previews. */
  compact?: boolean;
  /** Give `##` and `###` headings an anchor id, for a lesson's "In this lesson" outline. */
  headingIds?: boolean;
}

/** The words of a heading's children, whatever inline code or emphasis they contain. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return isValidElement<{ children?: ReactNode }>(node) ? textOf(node.props.children) : '';
}

export function Markdown({ children, className, compact = false, headingIds = false }: MarkdownProps) {
  const heading = (Tag: 'h2' | 'h3') =>
    headingIds
      ? function Heading({ children: headingChildren }: { children?: ReactNode }) {
          return (
            <Tag id={headingId(textOf(headingChildren))} className="scroll-mt-4">
              {headingChildren}
            </Tag>
          );
        }
      : Tag;
  return (
    <div className={cn('prose prose-sheet', compact && 'prose-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          h2: heading('h2'),
          h3: heading('h3'),
          a: ({ href = '', children: linkChildren }) =>
            href.startsWith('/') ? (
              <Link to={href}>{linkChildren}</Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {linkChildren}
              </a>
            ),
          pre: ({ children: preChildren }) => {
            const code = isValidElement<{ className?: string; children?: unknown }>(preChildren) ? preChildren.props : undefined;
            return code?.className?.includes('language-mindmap') ? <MindMap source={String(code.children ?? '')} /> : <pre>{preChildren}</pre>;
          },
          table: ({ children: tableChildren }) => (
            <div className="overflow-x-auto">
              <table>{tableChildren}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
