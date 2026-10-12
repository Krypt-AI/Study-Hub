import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ToastProvider } from '@/components/ui/Toast';
import { RepositoryProvider } from '@/data/RepositoryProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { router } from './router';
import { ThemeProvider } from './ThemeProvider';

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
          <AuthProvider>
            <RepositoryProvider>
              <RouterProvider router={router} />
            </RepositoryProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
