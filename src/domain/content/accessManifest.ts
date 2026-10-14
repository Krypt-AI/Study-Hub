/**
 * Build-time side of the access rules (see accessRules.ts): which courses and material
 * sources are open, and the split of the search index into an open part and one that needs an account.
 */
import type { AccessManifest } from './accessRules';
import type { Course, CourseCategory, SearchDocument } from './types';

/** The school levels and University are open to guests; the extras need an account. */
export const isOpenCategory = (category: CourseCategory) => category === 'university' || category === 'elementary' || category === 'secondary';

/** The material source a page image, source-pages block or audio file belongs to. */
function materialSources(value: unknown, found: Set<string>): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) materialSources(item, found);
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ((record.kind === 'page-image' || record.kind === 'source-pages') && typeof record.sourceId === 'string') found.add(record.sourceId);
    if (record.kind === 'audio' && typeof record.src === 'string') {
      const source = /^\/materials\/[^/]+\/([^/]+)\//u.exec(record.src)?.[1];
      if (source) found.add(source);
    }
    for (const child of Object.values(record)) materialSources(child, found);
  }
  return found;
}

/**
 * A source is open only if no locked course uses it, so a page shared with a locked
 * course stays locked.
 */
export function buildAccessManifest(courses: readonly Course[]): AccessManifest {
  const open = courses.filter((course) => isOpenCategory(course.category));
  const locked = courses.filter((course) => !isOpenCategory(course.category));
  const lockedSources = materialSources(locked, new Set());
  return {
    openCourses: open.map((course) => course.id.toLowerCase()).sort(),
    openSources: [...materialSources(open, new Set())]
      .filter((source) => !lockedSources.has(source))
      .map((source) => source.toLowerCase())
      .sort(),
  };
}

/** Documents of open courses, certifications and roadmaps are open; the rest need an account. */
export function splitSearchDocuments(documents: readonly SearchDocument[], manifest: AccessManifest) {
  const isOpen = (document: SearchDocument) => !document.courseId || manifest.openCourses.includes(document.courseId.toLowerCase());
  return {
    open: documents.filter(isOpen),
    account: documents.filter((document) => !isOpen(document)),
  };
}
