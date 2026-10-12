/**
 * Who may open which content when Study Hub is hosted with sign-in (docs/DEPLOY.md).
 *
 * University courses, and the page images they show, are open to everyone. Every other course,
 * its pages and audio, and the search index over them are for members: signed-in users whose
 * access token carries `study_hub_member` (set from the members list in the database).
 *
 * The build writes an `AccessManifest`, the app reads it to show locks, and the Netlify edge
 * function enforces it. This file has no imports so the edge function can use it as is.
 */

export type Access = 'open' | 'members';

export interface AccessManifest {
  /** Course ids anyone can open. */
  openCourses: string[];
  /** Material sources (page images, audio) referenced only by open courses. */
  openSources: string[];
}

export const ACCESS_MANIFEST_PATH = '/content/access.json';
export const OPEN_SEARCH_INDEX_PATH = '/content/search-index.json';
export const MEMBERS_SEARCH_INDEX_PATH = '/content/search-index-members.json';

/** Cookie the app keeps in step with the Supabase access token, so file requests carry it. */
export const ACCESS_COOKIE = 'study-hub-access';
/** Access-token claim added by the database's custom access token hook. */
export const MEMBER_CLAIM = 'study_hub_member';

const COURSE_FILE = /^\/content\/courses\/([^/]+)\.json$/u;
const MATERIAL_FILE = /^\/materials\/[^/]+\/([^/]+)\//u;

/**
 * The access a request path needs. Paths are compared decoded and in lower case, so an escaped
 * or differently cased URL cannot slip past the rules, and anything under /content/courses/ or
 * /materials/ that is not listed as open is for members.
 */
export function accessFor(pathname: string, manifest: AccessManifest): Access {
  const path = safeDecode(pathname).toLowerCase();
  if (path.startsWith('/content/courses/')) {
    const course = COURSE_FILE.exec(path)?.[1];
    return course && manifest.openCourses.includes(course) ? 'open' : 'members';
  }
  if (path.startsWith('/materials/')) {
    const source = MATERIAL_FILE.exec(path)?.[1];
    return source && manifest.openSources.includes(source) ? 'open' : 'members';
  }
  if (path === MEMBERS_SEARCH_INDEX_PATH) return 'members';
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
