import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';

export function RouteErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error;
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <ErrorState title="This page failed to load" error={message} onRetry={() => window.location.reload()} />
      <ButtonLink to="/" className="mt-4">
        Back to the dashboard
      </ButtonLink>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="max-w-xl py-10">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-ink-muted">That address does not match any page in Study Hub.</p>
      <ButtonLink to="/" className="mt-4">
        Back to the dashboard
      </ButtonLink>
    </div>
  );
}
