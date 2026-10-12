import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { LoadingState } from '@/components/ui/Feedback';
import { ToastProvider } from '@/components/ui/Toast';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { router } from './router';
import { ThemeProvider } from './ThemeProvider';

const SignInScreen = lazy(() => import('@/features/auth/SignInScreen'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RepositoryProvider
            signIn={(onReady) => (
              <Suspense fallback={<LoadingState />}>
                <SignInScreen onReady={onReady} />
              </Suspense>
            )}
          >
            <RouterProvider router={router} />
          </RepositoryProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
