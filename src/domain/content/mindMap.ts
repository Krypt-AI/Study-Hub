/**
 * Mind maps written in lesson Markdown as a fenced "mindmap" block: the first line is the centre,
 * then a bulleted outline of branches, two spaces deeper per level.
 *
 *     ```mindmap
 *     Chapter 2 · HTML
 *     - Document structure
 *       - <!DOCTYPE html>
 *       - head and body
 *     - Text elements
 *     ```
 */
export interface MindMapNode {
  label: string;
  children: MindMapNode[];
}

export interface MindMap {
  root: string;
  branches: MindMapNode[];
}

const INDENT = 2;

export function parseMindMap(source: string): MindMap {
  const lines = source.split(/\r?\n/u).filter((line) => line.trim() !== '');
  const [first = '', ...rest] = lines;
  const root = first.trim().replace(/^[-*]\s+/u, '');
  const branches: MindMapNode[] = [];
  // The open node at each depth: a line nests under the nearest shallower one.
  const path: MindMapNode[] = [];
  for (const line of rest) {
    const match = /^(\s*)[-*]\s+(.*)$/u.exec(line);
    if (!match) throw new Error(`mind map "${root}": "${line.trim()}" is not a "- " item`);
    const depth = Math.min(Math.floor((match[1] ?? '').length / INDENT), path.length);
    const node: MindMapNode = { label: (match[2] ?? '').trim(), children: [] };
    if (depth === 0) branches.push(node);
    else path[depth - 1]?.children.push(node);
    path.length = depth;
    path.push(node);
  }
  return { root, branches };
}
