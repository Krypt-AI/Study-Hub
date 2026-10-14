/**
 * The learner's visibility (their level, chosen extras and languages) and what it lets them see. Every
 * page that lists courses, certifications or roadmaps takes them from here, never from the catalog
 * directly; a page that follows a link to one course still loads it by id.
 */
import { useMemo } from 'react';
import { useReviewStates, useSettings } from '@/data/queries';
import type { Settings } from '@/data/records';
import { useCatalog } from '@/domain/content/load';
import type { Catalog, CourseSummary } from '@/domain/content/types';
import { showsCertifications, showsRoadmaps, type Visibility, visibleCertifications, visibleCourses } from '@/domain/content/visibility';
import { inFocus } from '@/domain/learning/focus';
import { type AuthState, canOpenLockedContent, useAuth } from '@/features/auth/useAuth';

export function visibilityOf(settings: Settings, auth: AuthState): Visibility {
  return {
    profile: settings.profile,
    // Whoever can open the extras' files may choose them: signed in, or local mode (which has no sign-in).
    extrasAllowed: canOpenLockedContent(auth),
    visibleCategories: settings.visibleCategories,
    languageBySubject: settings.languageBySubject,
  };
}

export function useVisibility(): Visibility | undefined {
  const settings = useSettings();
  const auth = useAuth();
  return useMemo(() => (settings.data ? visibilityOf(settings.data, auth) : undefined), [settings.data, auth]);
}

export interface VisibleCatalog extends Catalog {
  /** Whether the Certifications page and the AI engineering roadmap are offered at all. */
  showsCertifications: boolean;
  showsRoadmaps: boolean;
  visibility: Visibility;
}

/** The catalog cut to what the learner sees; undefined while loading. */
export function useVisibleCatalog(): { data: VisibleCatalog | undefined; error: Error | null; refetch: () => unknown } {
  const catalog = useCatalog();
  const visibility = useVisibility();
  const data = useMemo(() => {
    if (!catalog.data || !visibility) return undefined;
    return {
      ...catalog.data,
      courses: visibleCourses(catalog.data.courses, visibility),
      certifications: visibleCertifications(catalog.data.certifications, visibility),
      roadmaps: showsRoadmaps(visibility) ? catalog.data.roadmaps : [],
      showsCertifications: showsCertifications(visibility),
      showsRoadmaps: showsRoadmaps(visibility),
      visibility,
    };
  }, [catalog.data, visibility]);
  return { data, error: catalog.error, refetch: catalog.refetch };
}

/** Ids of the courses the learner sees, or undefined while loading. */
export function useVisibleCourseIds(): ReadonlySet<string> | undefined {
  const catalog = useVisibleCatalog();
  return useMemo(() => (catalog.data ? new Set(catalog.data.courses.map((course: CourseSummary) => course.id)) : undefined), [catalog.data]);
}

/**
 * Review states that count for Today, the due count and the due-review session: the subjects on Today
 * (all when none is chosen), among the courses the learner sees. Hidden courses add no pressure.
 */
export function useFocusReviewStates() {
  const reviews = useReviewStates();
  const settings = useSettings();
  const visible = useVisibleCourseIds();
  const data = useMemo(() => {
    if (!reviews.data || !settings.data || !visible) return undefined;
    return inFocus(reviews.data, settings.data.todayCourseIds).filter((review) => !review.courseId || visible.has(review.courseId));
  }, [reviews.data, settings.data, visible]);
  return { data, error: reviews.error ?? settings.error };
}
