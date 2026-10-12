/**
 * Runs before a hosted build (netlify.toml): refuses to publish a site that would be broken
 * or unsafe. It checks that Supabase is configured, that the browser key is the public one
 * (never the service_role / secret key), and that the content the gate needs can be built.
 *
 *   npm run check:deploy
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadEnv } from 'vite';

const ROOT = join(import.meta.dirname, '..');

/** A legacy Supabase key is a JWT whose `role` claim names the key. */
function jwtRole(key: string): string | undefined {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1] ?? '', 'base64url').toString('utf8')) as { role?: unknown };
    return typeof payload.role === 'string' ? payload.role : undefined;
  } catch {
    return undefined;
  }
}

export function deployProblems(env: Record<string, string | undefined>, hasPrivateCourses: boolean): string[] {
  const problems: string[] = [];
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url) problems.push('VITE_SUPABASE_URL is not set: without Supabase nobody can sign in and every members-only course stays locked.');
  else if (!/^https:\/\/[^/]+$/u.test(url.replace(/\/+$/u, ''))) problems.push(`VITE_SUPABASE_URL should look like https://<project-ref>.supabase.co, not "${url}".`);
  if (!key) problems.push('VITE_SUPABASE_ANON_KEY is not set (Supabase: Project Settings -> API Keys, the publishable or anon key).');
  else if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
    problems.push('VITE_SUPABASE_ANON_KEY holds a secret / service_role key. It would be published to every visitor: use the publishable (anon) key.');
  }
  if (!hasPrivateCourses) problems.push('content/private/courses is empty: the University courses would be missing. Deploy from the computer that has them.');
  return problems;
}

function main(): void {
  const env = { ...loadEnv('production', ROOT, 'VITE_'), ...process.env };
  const privateDir = join(ROOT, 'content', 'private', 'courses');
  const hasPrivateCourses = existsSync(privateDir) && readdirSync(privateDir).length > 0;
  const problems = deployProblems(env, hasPrivateCourses);
  if (problems.length) {
    for (const problem of problems) console.error(`deploy check: ${problem}`);
    console.error('\nNot deploying. See docs/DEPLOY.md.');
    process.exit(1);
  }
  console.log('Deploy check passed: Supabase is configured with a public key, and the private courses are present.');
}

// Run as a script, not when a test imports deployProblems.
if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main();
