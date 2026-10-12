/**
 * Verifies a Supabase access token: signature, issuer, audience and expiry. Projects signed with
 * the asymmetric JWT signing keys are checked against the project's public JWKS; projects still
 * on the legacy shared secret need SUPABASE_JWT_SECRET.
 */
import { createRemoteJWKSet, decodeProtectedHeader, type JWTPayload, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface TokenVerifierOptions {
  supabaseUrl: string;
  /** Legacy HS256 secret (Project Settings -> JWT Keys -> Legacy JWT Secret). */
  jwtSecret?: string;
  /** Public keys; defaults to the project's JWKS endpoint. */
  keys?: JWTVerifyGetKey;
}

export type TokenVerifier = (token: string | undefined) => Promise<JWTPayload | undefined>;

export function supabaseTokenVerifier({ supabaseUrl, jwtSecret, keys }: TokenVerifierOptions): TokenVerifier {
  const base = supabaseUrl.replace(/\/+$/u, '');
  const publicKeys = keys ?? createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`));
  const secret = jwtSecret ? new TextEncoder().encode(jwtSecret) : undefined;
  const claims = { issuer: `${base}/auth/v1`, audience: 'authenticated' };

  return async (token) => {
    if (!token) return undefined;
    try {
      const { alg } = decodeProtectedHeader(token);
      if (alg === 'HS256') {
        if (!secret) return undefined;
        return (await jwtVerify(token, secret, { ...claims, algorithms: ['HS256'] })).payload;
      }
      return (await jwtVerify(token, publicKeys, { ...claims, algorithms: ['ES256', 'RS256'] })).payload;
    } catch {
      return undefined;
    }
  };
}
