import { describe, expect, it } from 'vitest';
import { sectionByHeading } from './sections';

const lesson = `## Echo

Intro.

### Example 1

\`\`\`php
# not a heading inside code
echo "Hi";
\`\`\`

After the code.

### Example 2

Second.

## Loops

Loop text.`;

describe('finding a lesson section by its heading', () => {
  it('returns the section up to the next heading of the same or a higher level', () => {
    expect(sectionByHeading(lesson, 'Example 1')).toBe('### Example 1\n\n```php\n# not a heading inside code\necho "Hi";\n```\n\nAfter the code.');
    expect(sectionByHeading(lesson, 'echo')).toContain('### Example 2');
    expect(sectionByHeading(lesson, 'echo')).not.toContain('Loop text');
  });

  it('runs to the end for the last section, and is undefined for an unknown heading', () => {
    expect(sectionByHeading(lesson, 'Loops')).toBe('## Loops\n\nLoop text.');
    expect(sectionByHeading(lesson, 'Example 9')).toBeUndefined();
  });
});
