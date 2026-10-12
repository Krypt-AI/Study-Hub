import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import type { AccessManifest } from '../../../src/domain/content/accessRules.ts';
import { decide } from './gate.ts';
import { supabaseTokenVerifier, type TokenVerifier } from './token.ts';

const SUPABASE_URL = 'https://example.supabase.co';
const SECRET = 'legacy-secret-at-least-32-characters-long';
const manifest: AccessManifest = { openCourses: ['cmpd363'], openSources: [] };

let verify: TokenVerifier;
let sign: (claims: Record<string, unknown>, options?: { issuer?: string; expiresIn?: string }) => Promise<string>;

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'key-1', alg: 'ES256' };
  verify = supabaseTokenVerifier({ supabaseUrl: `${SUPABASE_URL}/`, jwtSecret: SECRET, keys: createLocalJWKSet({ keys: [jwk] }) });
  sign = (claims, { issuer = `${SUPABASE_URL}/auth/v1`, expiresIn = '1h' } = {}) =>
    new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: 'key-1' }).setIssuer(issuer).setAudience('authenticated').setSubject('user-1').setIssuedAt().setExpirationTime(expiresIn).sign(privateKey);
});

describe('supabaseTokenVerifier', () => {
  it('accepts a token signed with the project key', async () => {
    expect(await verify(await sign({ role: 'authenticated' }))).toMatchObject({ sub: 'user-1', role: 'authenticated' });
  });

  it('accepts a token signed with the legacy secret', async () => {
    const token = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET));
    expect(await verify(token)).toMatchObject({ role: 'authenticated' });
  });

  it('rejects missing, expired, foreign, forged and garbage tokens', async () => {
    expect(await verify(undefined)).toBeUndefined();
    expect(await verify(await sign({}, { expiresIn: '-1m' }))).toBeUndefined();
    expect(await verify(await sign({}, { issuer: 'https://other.supabase.co/auth/v1' }))).toBeUndefined();
    const forged = await new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setAudience('authenticated')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('a-different-secret-of-enough-length!!'));
    expect(await verify(forged)).toBeUndefined();
    expect(await verify('not-a-jwt')).toBeUndefined();
  });
});

describe('decide', () => {
  it('lets anyone open university content', async () => {
    expect(await decide('/content/courses/cmpd363.json', undefined, manifest, verify)).toEqual({ allow: true, locked: false });
  });

  it('asks signed-out visitors, and anonymous or forged sessions, to sign in', async () => {
    expect(await decide('/content/courses/hsk-1.json', undefined, manifest, verify)).toMatchObject({ allow: false, status: 401 });
    expect(await decide('/content/courses/hsk-1.json', await sign({ role: 'authenticated', is_anonymous: true }), manifest, verify)).toMatchObject({ allow: false, status: 401 });
    expect(await decide('/content/courses/hsk-1.json', await sign({ role: 'anon' }), manifest, verify)).toMatchObject({ allow: false, status: 401 });
  });

  it('serves every signed-in account', async () => {
    expect(await decide('/materials/audio/n5/03.mp3', await sign({ role: 'authenticated' }), manifest, verify)).toEqual({ allow: true, locked: true });
    expect(await decide('/content/courses/hsk-1.json', await sign({ role: 'authenticated', is_anonymous: false }), manifest, verify)).toEqual({ allow: true, locked: true });
  });
});
