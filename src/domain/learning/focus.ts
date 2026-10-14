/**
 * Starred courses are the ones the learner is taking now: Today, the due count and due reviews show
 * only their work, so other courses never add pressure. With nothing starred, every course counts.
 */

/** Whether a course's work counts for Today and due reviews. */
export function isInFocus(courseId: string | undefined, starredCourseIds: readonly string[]): boolean {
  return starredCourseIds.length === 0 || (courseId !== undefined && starredCourseIds.includes(courseId));
}

/** The records of starred courses, or all of them when nothing is starred. */
export function inFocus<T extends { courseId?: string }>(records: T[], starredCourseIds: readonly string[]): T[] {
  return starredCourseIds.length === 0 ? records : records.filter((record) => isInFocus(record.courseId, starredCourseIds));
}

/** Stars or unstars a course, keeping the learner's order. */
export function toggleStar(starredCourseIds: readonly string[], courseId: string): string[] {
  return starredCourseIds.includes(courseId) ? starredCourseIds.filter((id) => id !== courseId) : [...starredCourseIds, courseId];
}
