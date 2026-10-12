import { describe, expect, it } from 'vitest';
import { accessCookie } from './accessToken';

describe('accessCookie', () => {
  it('writes and clears the cookie', () => {
    expect(accessCookie({ access_token: 'abc', expires_in: 3600 }, true)).toBe('study-hub-access=abc; Max-Age=3600; Path=/; SameSite=Lax; Secure');
    expect(accessCookie(null, false)).toBe('study-hub-access=; Max-Age=0; Path=/; SameSite=Lax');
  });
});
