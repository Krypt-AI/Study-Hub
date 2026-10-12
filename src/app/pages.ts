/** Route pages, each loaded on first visit so the first screen stays small. */
import { lazy } from 'react';

export const TodayPage = lazy(() => import('@/features/today/TodayPage'));
export const CatalogPage = lazy(() => import('@/features/courses/CatalogPage'));
export const CoursePage = lazy(() => import('@/features/courses/CoursePage'));
export const LessonPage = lazy(() => import('@/features/courses/LessonPage'));
export const AssessmentPage = lazy(() => import('@/features/practice/AssessmentPage'));
export const PracticeHubPage = lazy(() => import('@/features/practice/PracticeHubPage'));
export const ReviewSessionPage = lazy(() => import('@/features/practice/ReviewSessionPage'));
export const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage'));
export const PlaygroundPage = lazy(() => import('@/features/playground/PlaygroundPage'));
export const ExercisePage = lazy(() => import('@/features/playground/ExercisePage'));
export const CertificationsPage = lazy(() => import('@/features/certifications/CertificationsPage'));
export const CertificationDetailPage = lazy(() => import('@/features/certifications/CertificationDetailPage'));
export const RoadmapPage = lazy(() => import('@/features/certifications/RoadmapPage'));
export const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
