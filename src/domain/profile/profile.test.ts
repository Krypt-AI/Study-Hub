import { describe, expect, it } from 'vitest';
import { parseProfile, suggestedLevel, suggestedYear, yearLabel } from './profile';

describe('the year an age suggests', () => {
  it('is Standard age − 6 for 7 to 12 and Form age − 12 for 13 to 17', () => {
    expect([7, 9, 12].map((age) => [suggestedLevel(age), suggestedYear('elementary', age)])).toEqual([
      ['elementary', 1],
      ['elementary', 3],
      ['elementary', 6],
    ]);
    expect([13, 15, 17].map((age) => [suggestedLevel(age), suggestedYear('secondary', age)])).toEqual([
      ['secondary', 1],
      ['secondary', 3],
      ['secondary', 5],
    ]);
    expect(suggestedLevel(18)).toBe('university');
  });

  it('stays within the level when the age is outside it', () => {
    expect(suggestedLevel(5)).toBe('elementary');
    expect(suggestedYear('elementary', 5)).toBe(1);
    expect(suggestedYear('secondary', 20)).toBe(5);
  });

  it('is named the way schools name it', () => {
    expect(yearLabel({ level: 'elementary', year: 3 })).toBe('Standard 3');
    expect(yearLabel({ level: 'secondary', year: 2 })).toBe('Form 2');
    expect(yearLabel({ level: 'university' })).toBe('University');
  });
});

describe('reading a stored profile', () => {
  it('keeps a valid profile', () => {
    expect(parseProfile({ age: 9, level: 'elementary', year: 3 })).toEqual({ age: 9, level: 'elementary', year: 3 });
    expect(parseProfile({ age: 21, level: 'university', year: 4 })).toEqual({ age: 21, level: 'university' });
  });

  it('suggests a year when the stored one is missing or out of range', () => {
    expect(parseProfile({ age: 14, level: 'secondary' })).toEqual({ age: 14, level: 'secondary', year: 2 });
    expect(parseProfile({ age: 14, level: 'secondary', year: 9 })).toEqual({ age: 14, level: 'secondary', year: 2 });
  });

  it('is missing when the age or level is not valid, so the Welcome page asks again', () => {
    expect(parseProfile(undefined)).toBeUndefined();
    expect(parseProfile({ age: 4, level: 'elementary' })).toBeUndefined();
    expect(parseProfile({ age: 9.5, level: 'elementary' })).toBeUndefined();
    expect(parseProfile({ age: 9, level: 'college' })).toBeUndefined();
  });
});
