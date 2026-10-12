/** Route builders shared by the app and the content build (search index links). */
export const courseUrl = (courseId: string) => `/courses/${courseId}`;
export const lessonUrl = (courseId: string, lessonId: string) => `/courses/${courseId}/lessons/${lessonId}`;
export const assessmentUrl = (courseId: string, assessmentId: string) => `/courses/${courseId}/assessments/${assessmentId}`;
export const certificationUrl = (certificationId: string) => `/certifications/${certificationId}`;
export const projectUrl = (projectId: string) => `/playground/${projectId}`;
export const exerciseUrl = (exerciseId: string) => `/playground/exercises/${exerciseId}`;
