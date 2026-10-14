/**
 * A section of a lesson's Markdown, found by its heading: everything from that heading to the next
 * heading of the same or a higher level. Used to show a question the example it refers to.
 */

const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/u;

/** Headings are compared without Markdown emphasis and case: "**Example 1**" matches "example 1". */
const plain = (text: string) => text.replace(/[*_`]/gu, '').trim().toLocaleLowerCase();

/** The section's Markdown including its heading, or undefined when the lesson has no such heading. */
export function sectionByHeading(markdown: string, heading: string): string | undefined {
  const lines = markdown.split(/\r?\n/u);
  let inFence = false;
  let start = -1;
  let level = 0;
  for (const [index, line] of lines.entries()) {
    if (/^\s*```/u.test(line)) inFence = !inFence;
    if (inFence) continue;
    const match = HEADING.exec(line);
    if (!match) continue;
    const depth = match[1]?.length ?? 0;
    if (start >= 0 && depth <= level) return lines.slice(start, index).join('\n').trim();
    if (start < 0 && plain(match[2] ?? '') === plain(heading)) {
      start = index;
      level = depth;
    }
  }
  return start >= 0 ? lines.slice(start).join('\n').trim() : undefined;
}
