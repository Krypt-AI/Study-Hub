import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './AppShell';
import {
  AssessmentPage,
  CalendarPage,
  CatalogPage,
  CertificationDetailPage,
  CertificationsPage,
  CoursePage,
  ExercisePage,
  LessonPage,
  PlaygroundPage,
  PracticeHubPage,
  ReviewSessionPage,
  RoadmapPage,
  SettingsPage,
  TodayPage,
} from './pages';
import { NotFoundPage, RouteErrorPage } from './RouteErrorPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'courses', element: <CatalogPage /> },
      { path: 'courses/:courseId', element: <CoursePage /> },
      { path: 'courses/:courseId/lessons/:lessonId', element: <LessonPage /> },
      { path: 'courses/:courseId/assessments/:assessmentId', element: <AssessmentPage /> },
      { path: 'practice', element: <PracticeHubPage /> },
      { path: 'practice/:mode', element: <ReviewSessionPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      // The notebook was replaced by the calendar; keep old links working.
      { path: 'notebook/*', element: <Navigate to="/calendar" replace /> },
      { path: 'playground/exercises/:exerciseId', element: <ExercisePage /> },
      { path: 'playground/:projectId?', element: <PlaygroundPage /> },
      { path: 'certifications', element: <CertificationsPage /> },
      { path: 'certifications/:certificationId', element: <CertificationDetailPage /> },
      { path: 'roadmaps/:roadmapId', element: <RoadmapPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
