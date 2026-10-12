import { describe, expect, it } from 'vitest';
import { accessCookie, isMemberToken, tokenClaims } from './accessToken';

const base64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = (claims: Record<string, unknown>) => `${base64url({ alg: 'ES256' })}.${base64url(claims)}.signature`;

describe('access token', () => {
  it('reads claims, including non-ASCII names', () => {
    expect(tokenClaims(token({ sub: 'u1', name: 'Zoë 学生' }))).toEqual({ sub: 'u1', name: 'Zoë 学生' });
    expect(tokenClaims('garbage')).toBeUndefined();
    expect(tokenClaims('a.%%%.c')).toBeUndefined();
  });

  it('is a member token only with the claim set to true', () => {
    expect(isMemberToken(token({ study_hub_member: true }))).toBe(true);
    expect(isMemberToken(token({ study_hub_member: false }))).toBe(false);
    expect(isMemberToken(token({}))).toBe(false);
  });

  it('writes and clears the cookie', () => {
    expect(accessCookie({ access_token: 'abc', expires_in: 3600 }, true)).toBe('study-hub-access=abc; Max-Age=3600; Path=/; SameSite=Lax; Secure');
    expect(accessCookie(null, false)).toBe('study-hub-access=; Max-Age=0; Path=/; SameSite=Lax');
  });
});
