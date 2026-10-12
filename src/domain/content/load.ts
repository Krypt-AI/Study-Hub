/**
 * Loading built content (public/content). The build step already validated it, so the
 * app only checks the schema version and caches files with React Query.
 */
import { type UseQueryResult, useQueries, useQuery } from '@tanstack/react-query';
import type { Catalog, Course, SearchDocument } from './types';
import { CONTENT_SCHEMA_VERSION } from './version';

export class ContentMissingError extends Error {
  constructor(path: string) {
    super(`Content file ${path} was not found. Run \`npm run content:build\` (and the import pipeline for your HSK/JLPT books).`);
    this.name = 'ContentMissingError';
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new ContentMissingError(path);
  return (await response.json()) as T;
}

export async function fetchCatalog(): Promise<Catalog> {
  const catalog = await fetchJson<Catalog>('/content/catalog.json');
  if (catalog.schemaVersion !== CONTENT_SCHEMA_VERSION) {
    throw new Error(`Content was built with schema v${catalog.schemaVersion}; this app expects v${CONTENT_SCHEMA_VERSION}. Run \`npm run content:build\`.`);
  }
  return catalog;
}

export const fetchCourse = (courseId: string) => fetchJson<Course>(`/content/courses/${encodeURIComponent(courseId)}.json`);

export const fetchSearchDocuments = () => fetchJson<SearchDocument[]>('/content/search-index.json');

const STATIC = { staleTime: Infinity, gcTime: 30 * 60 * 1000 } as const;

export const contentKeys = {
  catalog: ['content', 'catalog'] as const,
  course: (courseId: string) => ['content', 'course', courseId] as const,
  search: ['content', 'search'] as const,
};

export function useCatalog() {
  return useQuery({ queryKey: contentKeys.catalog, queryFn: fetchCatalog, ...STATIC });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: contentKeys.course(courseId ?? ''),
    queryFn: () => fetchCourse(courseId ?? ''),
    enabled: Boolean(courseId),
    ...STATIC,
  });
}

export interface LoadedCourses {
  courses: Map<string, Course>;
  pending: boolean;
  error: Error | null;
}

const combineCourses = (results: UseQueryResult<Course>[]): LoadedCourses => ({
  courses: new Map(results.flatMap((result) => (result.data ? [[result.data.id, result.data] as const] : []))),
  pending: results.some((result) => result.isPending),
  error: results.find((result) => result.error)?.error ?? null,
});

/** Several courses at once, e.g. for a review session that spans courses. */
export function useCourses(courseIds: readonly string[]): LoadedCourses {
  return useQueries({
    queries: courseIds.map((courseId) => ({ queryKey: contentKeys.course(courseId), queryFn: () => fetchCourse(courseId), ...STATIC })),
    combine: combineCourses,
  });
}

export function useSearchDocuments(enabled: boolean) {
  return useQuery({ queryKey: contentKeys.search, queryFn: fetchSearchDocuments, enabled, ...STATIC });
}
