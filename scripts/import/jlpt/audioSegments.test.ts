import { describe, expect, it } from 'vitest';
import { agreesWithScript, segmentSection } from './audioSegments.ts';

/** N2 問題1 as measured: four 12 s answer pauses (the last question's pause is cut off), short pauses elsewhere. */
const section1 = {
  duration: 643.55,
  silences: [
    [31.9, 3.2],
    [54.6, 3.0],
    [59.3, 3.2],
    [147.6, 3.2],
    [152.5, 3.1],
    [233.6, 12.1],
    [319.7, 2.3],
    [329.6, 12.2],
    [421.3, 2.1],
    [431.4, 12.1],
    [513.4, 2.1],
    [523.0, 12.1],
    [621.9, 2.1],
  ] as Array<[number, number]>,
};

describe('segmentSection', () => {
  it('cuts each question at the end of its answer pause, with the example and instructions first', () => {
    const segments = segmentSection(section1, [1, 2, 3, 4, 5], true)!;
    expect(segments.get(0)).toEqual({ start: 0, end: 150.8 });
    expect(segments.get(1)).toEqual({ start: 150.8, end: 245.7 });
    expect(segments.get(2)).toEqual({ start: 245.7, end: 341.8 });
    expect(segments.get(5)).toEqual({ start: 535.1, end: 643.55 });
  });

  it('uses the pause group that occurs once per question, not the reading pauses', () => {
    // 問題2 style: a 20 s reading pause in every item and a 12 s answer pause after each question but the last.
    const silences: Array<[number, number]> = [];
    let time = 40;
    for (let item = 0; item < 4; item++) {
      silences.push([time + 10, 20], [time + 80, 3]);
      if (item > 0 && item < 3) silences.push([time + 100, 12]);
      time += 112;
    }
    const segments = segmentSection({ duration: time, silences }, [1, 2, 3], true);
    expect(segments).toBeDefined();
    expect([...segments!.keys()]).toEqual([1, 2, 3, 0]);
  });

  it('declines when no pause group matches the number of questions', () => {
    const twelvePauses = { duration: 488, silences: Array.from({ length: 12 }, (_, index) => [108 + index * 34, 8] as [number, number]) };
    expect(segmentSection(twelvePauses, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], true)).toBeUndefined();
  });
});

describe('agreesWithScript', () => {
  const segments = new Map([
    [1, { start: 0, end: 90 }],
    [2, { start: 90, end: 200 }],
    [3, { start: 200, end: 280 }],
    [4, { start: 280, end: 400 }],
  ]);

  it('accepts segments whose lengths rise and fall with the script lengths', () => {
    expect(agreesWithScript(segments, new Map([[1, 300], [2, 360], [3, 280], [4, 400]]))).toBe(true);
  });

  it('rejects segments that contradict the script', () => {
    expect(agreesWithScript(segments, new Map([[1, 400], [2, 280], [3, 380], [4, 260]]))).toBe(false);
  });
});
