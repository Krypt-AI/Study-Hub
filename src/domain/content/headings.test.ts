import { describe, expect, it } from 'vitest';
import { headingId, lessonHeadings, markdownHeadings, plainHeading } from './headings';

describe('plainHeading', () => {
  it('reduces inline code, emphasis and links to their words', () => {
    expect(plainHeading('Using `this` and **super**')).toBe('Using this and super');
    expect(plainHeading('See [the docs](https://example.com) now')).toBe('See the docs now');
  });
});

describe('headingId', () => {
  it('makes a readable, stable anchor', () => {
    expect(headingId('The `if` statement: syntax')).toBe('section-the-if-statement-syntax');
  });

  it('keeps letters of any script', () => {
    expect(headingId('助詞 の 使い方')).toBe('section-助詞-の-使い方');
  });

  it('never returns an empty slug', () => {
    expect(headingId('???')).toBe('section-untitled');
  });
});

describe('markdownHeadings', () => {
  it('lists second and third level headings in order', () => {
    const body = ['# Title', '## One', 'text', '### One A', '## Two', '#### Too deep'].join('\n');
    expect(markdownHeadings(body)).toEqual([
      { id: 'section-one', text: 'One', level: 2 },
      { id: 'section-one-a', text: 'One A', level: 3 },
      { id: 'section-two', text: 'Two', level: 2 },
    ]);
  });

  it('ignores comment lines inside fenced code', () => {
    const body = ['## Real', '```python', '## not a heading', '# nor this', '```', '## After'].join('\n');
    expect(markdownHeadings(body).map((heading) => heading.text)).toEqual(['Real', 'After']);
  });

  it('drops a trailing hash run', () => {
    expect(markdownHeadings('## Closed ##')[0]?.text).toBe('Closed');
  });
});

describe('lessonHeadings', () => {
  it('collects Markdown blocks only and lists a repeated heading once', () => {
    const outline = lessonHeadings([
      { kind: 'markdown', body: '## Example\n## Rules' },
      { kind: 'code', language: 'python', code: '## ignored' },
      { kind: 'markdown', body: '## Example\n## Summary' },
    ]);
    expect(outline.map((heading) => heading.text)).toEqual(['Example', 'Rules', 'Summary']);
  });
});
