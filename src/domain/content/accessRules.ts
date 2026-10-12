/**
 * Who may open which content when Study Hub is hosted with sign-in (docs/DEPLOY.md).
 *
 * University courses, and the page images they show, are open to everyone. Every other course,
 * its pages and audio, and the search index over them need an account: anyone signed in with
 * Google (or another enabled provider) can open them.
 *
 * The build writes an `AccessManifest`, the app reads it to show locks, and the Netlify edge
 * function enforces it. This file has no imports so the edge function can use it as is.
 */

export type Access = 'open' | 'account';

export interface AccessManifest {
  /** Course ids anyone can open. */
  openCourses: string[];
  /** Material sources (page images, audio) referenced only by open courses. */
  openSources: string[];
}

export const ACCESS_MANIFEST_PATH = '/content/access.json';
export const OPEN_SEARCH_INDEX_PATH = '/content/search-index.json';
export const ACCOUNT_SEARCH_INDEX_PATH = '/content/search-index-account.json';

/** Cookie the app keeps in step with the Supabase access token, so file requests carry it. */
export const ACCESS_COOKIE = 'study-hub-access';

const COURSE_FILE = /^\/content\/courses\/([^/]+)\.json$/u;
const MATERIAL_FILE = /^\/materials\/[^/]+\/([^/]+)\//u;

/**
 * The access a request path needs. Paths are compared decoded and in lower case, so an escaped
 * or differently cased URL cannot slip past the rules, and anything under /content/courses/ or
 * /materials/ that is not listed as open needs an account.
 */
export function accessFor(pathname: string, manifest: AccessManifest): Access {
  const path = safeDecode(pathname).toLowerCase();
  if (path.startsWith('/content/courses/')) {
    const course = COURSE_FILE.exec(path)?.[1];
    return course && manifest.openCourses.includes(course) ? 'open' : 'account';
  }
  if (path.startsWith('/materials/')) {
    const source = MATERIAL_FILE.exec(path)?.[1];
    return source && manifest.openSources.includes(source) ? 'open' : 'account';
  }
  if (path === ACCOUNT_SEARCH_INDEX_PATH) return 'account';
  return 'open';
}

/** A malformed escape cannot be decoded; keep the raw path, which then matches no open entry. */
function safeDecode(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}
