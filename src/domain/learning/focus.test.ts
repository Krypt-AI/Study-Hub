import { describe, expect, it } from 'vitest';
import { inFocus, isInFocus, setOnToday } from './focus';

describe('subjects on Today', () => {
  const reviews = [{ id: 'a', courseId: 'cmpd363' }, { id: 'b', courseId: 'hsk-1' }, { id: 'c' }];

  it('counts every subject while none is chosen', () => {
    expect(inFocus(reviews, [])).toEqual(reviews);
    expect(isInFocus(undefined, [])).toBe(true);
  });

  it('keeps only the chosen subjects’ work once one is chosen', () => {
    expect(inFocus(reviews, ['cmpd363']).map((review) => review.id)).toEqual(['a']);
    expect(isInFocus('hsk-1', ['cmpd363'])).toBe(false);
    expect(isInFocus(undefined, ['cmpd363'])).toBe(false);
  });

  it('switches a subject on and off', () => {
    expect(setOnToday(['hsk-1'], 'cmpd363', true)).toEqual(['hsk-1', 'cmpd363']);
    expect(setOnToday(['hsk-1', 'cmpd363'], 'cmpd363', true)).toEqual(['hsk-1', 'cmpd363']);
    expect(setOnToday(['hsk-1', 'cmpd363'], 'hsk-1', false)).toEqual(['cmpd363']);
  });
});
