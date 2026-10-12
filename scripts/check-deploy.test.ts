import { describe, expect, it } from 'vitest';
import { deployProblems } from './check-deploy.ts';

const fakeJwt = (claims: object) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`;
const good = { VITE_SUPABASE_URL: 'https://abcd.supabase.co', VITE_SUPABASE_ANON_KEY: 'sb_publishable_123' };

describe('deployProblems', () => {
  it('passes a configured site with a public key', () => {
    expect(deployProblems(good, true)).toEqual([]);
    expect(deployProblems({ ...good, VITE_SUPABASE_ANON_KEY: fakeJwt({ role: 'anon' }) }, true)).toEqual([]);
  });

  it('refuses a missing configuration or missing private courses', () => {
    expect(deployProblems({}, true)).toHaveLength(2);
    expect(deployProblems(good, false)).toEqual([expect.stringContaining('content/private/courses')]);
    expect(deployProblems({ ...good, VITE_SUPABASE_URL: 'abcd.supabase.co' }, true)).toEqual([expect.stringContaining('should look like')]);
  });

  it('refuses to publish a secret key', () => {
    expect(deployProblems({ ...good, VITE_SUPABASE_ANON_KEY: 'sb_secret_abc' }, true)).toEqual([expect.stringContaining('secret')]);
    expect(deployProblems({ ...good, VITE_SUPABASE_ANON_KEY: fakeJwt({ role: 'service_role' }) }, true)).toEqual([expect.stringContaining('service_role')]);
  });
});
