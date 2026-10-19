/** Route builders shared by the app and the content build (search index links). */
export const courseUrl = (courseId: string) => `/courses/${courseId}`;
/** A module (unit) of a course: the course page, opened at that module. */
export const moduleUrl = (courseId: string, unitId: string) => `/courses/${courseId}#${encodeURIComponent(unitId)}`;
export const lessonUrl = (courseId: string, lessonId: string) => `/courses/${courseId}/lessons/${lessonId}`;
export const assessmentUrl = (courseId: string, assessmentId: string) => `/courses/${courseId}/assessments/${assessmentId}`;
export const certificationUrl = (certificationId: string) => `/certifications/${certificationId}`;
export const projectUrl = (projectId: string) => `/playground/${projectId}`;
export const exerciseUrl = (exerciseId: string) => `/playground/exercises/${exerciseId}`;
