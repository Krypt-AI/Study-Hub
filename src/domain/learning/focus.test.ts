import { describe, expect, it } from 'vitest';
import { inFocus, isInFocus, toggleStar } from './focus';

describe('starred courses', () => {
  const reviews = [{ id: 'a', courseId: 'cmpd363' }, { id: 'b', courseId: 'hsk-1' }, { id: 'c' }];

  it('counts every course while nothing is starred', () => {
    expect(inFocus(reviews, [])).toEqual(reviews);
    expect(isInFocus(undefined, [])).toBe(true);
  });

  it('keeps only the starred courses’ work once something is starred', () => {
    expect(inFocus(reviews, ['cmpd363']).map((review) => review.id)).toEqual(['a']);
    expect(isInFocus('hsk-1', ['cmpd363'])).toBe(false);
    expect(isInFocus(undefined, ['cmpd363'])).toBe(false);
  });

  it('stars and unstars a course', () => {
    expect(toggleStar(['hsk-1'], 'cmpd363')).toEqual(['hsk-1', 'cmpd363']);
    expect(toggleStar(['hsk-1', 'cmpd363'], 'hsk-1')).toEqual(['cmpd363']);
  });
});
