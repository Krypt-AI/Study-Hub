import { describe, expect, it } from 'vitest';
import { parseMindMap } from './mindMap';

describe('parseMindMap', () => {
  it('reads the centre and nests items two spaces deeper per level', () => {
    const map = parseMindMap(['Chapter 2 · HTML', '- Structure', '  - head', '    - title', '  - body', '- Text'].join('\n'));
    expect(map).toEqual({
      root: 'Chapter 2 · HTML',
      branches: [
        {
          label: 'Structure',
          children: [
            { label: 'head', children: [{ label: 'title', children: [] }] },
            { label: 'body', children: [] },
          ],
        },
        { label: 'Text', children: [] },
      ],
    });
  });

  it('ignores blank lines and CRLF, and never nests deeper than one level below its parent', () => {
    const map = parseMindMap('Root\r\n\r\n- A\r\n      - too deep\r\n- B\r\n');
    expect(map.branches).toEqual([
      { label: 'A', children: [{ label: 'too deep', children: [] }] },
      { label: 'B', children: [] },
    ]);
  });

  it('rejects a line that is not an item', () => {
    expect(() => parseMindMap('Root\n- A\nloose text')).toThrow(/not a "- " item/u);
  });
});
