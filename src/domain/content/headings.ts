/**
 * Section headings of a lesson: the anchors its headings carry, and the outline ("In this lesson")
 * that jumps to them. Only `##` and `###` headings of Markdown blocks count; lines inside fenced
 * code are ignored, so a `# comment` in a code sample is never mistaken for a heading.
 */
import type { Block } from './types';

export interface LessonHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

const HEADING = /^(#{2,3})\s+(.+?)\s*#*\s*$/u;
const FENCE = /^\s*(```|~~~)/u;

/** A heading's visible text: inline code, emphasis and links reduced to their words. */
export function plainHeading(raw: string): string {
  return raw
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/[`*_]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** The anchor id of a heading. Letters of any script are kept, so Chinese and Japanese headings work too. */
export function headingId(text: string): string {
  const slug = plainHeading(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return `section-${slug || 'untitled'}`;
}

/** The headings of one Markdown body, in reading order. */
export function markdownHeadings(body: string): LessonHeading[] {
  const headings: LessonHeading[] = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = HEADING.exec(line);
    if (!match) continue;
    const text = plainHeading(match[2] ?? '');
    if (text) headings.push({ id: headingId(text), text, level: match[1]?.length === 2 ? 2 : 3 });
  }
  return headings;
}

/** The outline of a lesson: its Markdown blocks' headings, a repeated heading listed once. */
export function lessonHeadings(blocks: readonly Block[]): LessonHeading[] {
  const seen = new Set<string>();
  return blocks
    .flatMap((block) => (block.kind === 'markdown' ? markdownHeadings(block.body) : []))
    .filter((heading) => !seen.has(heading.id) && !!seen.add(heading.id));
}
