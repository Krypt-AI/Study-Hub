/**
 * A mind map from a lesson's "mindmap" block: the centre in print ink, its numbered branches below,
 * and each branch's ideas as a ruled tree. Semantically it is a nested list, so it reads in order.
 */
import { parseMindMap, type MindMapNode } from '@/domain/content/mindMap';

export function MindMap({ source }: { source: string }) {
  const { root, branches } = parseMindMap(source);
  return (
    <figure aria-label={`Mind map: ${root}`} className="not-prose my-6 flex flex-col items-center">
      <p className="max-w-full rounded-full border-2 border-print bg-print-soft px-5 py-2 text-center font-display text-lg leading-snug font-semibold text-ink">{root}</p>
      <span className="h-4 w-px bg-print-line" aria-hidden />
      <ol className="grid w-full gap-3 border-t border-rule pt-4 sm:grid-cols-2">
        {branches.map((branch, index) => (
          <li key={`${index}-${branch.label}`} className="rounded-md border border-rule bg-sheet px-3.5 py-3">
            <p className="flex items-baseline gap-2 font-display text-[1.0625rem] leading-snug font-semibold text-ink">
              <span className="display-numerals text-print">{index + 1}</span>
              {branch.label}
            </p>
            <Ideas nodes={branch.children} />
          </li>
        ))}
      </ol>
    </figure>
  );
}

function Ideas({ nodes }: { nodes: MindMapNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-col gap-1 border-l border-print-line pl-3 text-sm leading-snug text-ink-muted">
      {nodes.map((node, index) => (
        <li key={`${index}-${node.label}`} className="relative before:absolute before:top-[0.6em] before:-left-3 before:h-px before:w-2 before:bg-print-line">
          <span className={node.children.length > 0 ? 'font-medium text-ink' : undefined}>{node.label}</span>
          <Ideas nodes={node.children} />
        </li>
      ))}
    </ul>
  );
}
