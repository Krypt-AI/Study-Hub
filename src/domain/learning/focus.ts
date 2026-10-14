/**
 * The subjects shown on Today: the learner switches "Show on Today" on for the subjects they are
 * taking now, and only those bring their due reviews and weak topics to Today, the due count and the
 * due-review session, so other subjects never add pressure. With none chosen, every subject counts.
 */

/** Whether a course's work counts for Today and due reviews. */
export function isInFocus(courseId: string | undefined, todayCourseIds: readonly string[]): boolean {
  return todayCourseIds.length === 0 || (courseId !== undefined && todayCourseIds.includes(courseId));
}

/** The records of the subjects on Today, or all of them when none is chosen. */
export function inFocus<T extends { courseId?: string }>(records: T[], todayCourseIds: readonly string[]): T[] {
  return todayCourseIds.length === 0 ? records : records.filter((record) => isInFocus(record.courseId, todayCourseIds));
}

/** Shows a subject on Today, or takes it off, keeping the learner's order. */
export function setOnToday(todayCourseIds: readonly string[], courseId: string, on: boolean): string[] {
  const without = todayCourseIds.filter((id) => id !== courseId);
  return on ? [...without, courseId] : without;
}
