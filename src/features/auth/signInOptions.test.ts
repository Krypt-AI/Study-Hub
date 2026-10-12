import { describe, expect, it } from 'vitest';
import { safeNext, signInMethods } from './signInOptions';

describe('signInMethods', () => {
  it('defaults to Google, Discord and GitHub', () => {
    expect(signInMethods('')).toEqual(['google', 'discord', 'github']);
  });

  it('keeps the listed order and drops unknown or repeated entries', () => {
    expect(signInMethods(' GitHub, email,twitter,github ')).toEqual(['github', 'email']);
  });
});

describe('safeNext', () => {
  it('keeps paths on this site', () => {
    expect(safeNext('/courses/hsk-1?tab=units')).toBe('/courses/hsk-1?tab=units');
  });

  it('refuses other sites, protocol-relative and backslash tricks, and loops back to sign-in', () => {
    expect(safeNext(null)).toBe('/');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext('/\\evil.example')).toBe('/');
    expect(safeNext('/sign-in?next=/')).toBe('/');
  });
});
