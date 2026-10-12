/**
 * Shown in place of a course the host refused because the visitor is not signed in. A signed-in
 * user only sees it if their sign-in expired, and can renew it.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Lock, LogIn, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import { ContentLockedError } from '@/domain/content/load';
import { providerNames } from './signInOptions';
import { useAuth } from './useAuth';

/** The error state for a page whose course could not be loaded, locked or otherwise. */
export function CourseLoadError({ error, title, onRetry }: { error: Error; title: string; onRetry?: () => void }) {
  if (error instanceof ContentLockedError) return <LockedContent />;
  return <ErrorState title={title} error={error} onRetry={onRetry} />;
}

export function LockedContent() {
  const auth = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [renewing, setRenewing] = useState(false);
  const next = `${location.pathname}${location.search}`;

  const renew = async () => {
    setRenewing(true);
    try {
      await auth.refreshSession();
      await queryClient.resetQueries({ queryKey: ['content'] });
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-md border border-rule bg-sheet px-5 py-5">
      <span className="flex items-center gap-2 font-display text-lg font-semibold">
        <Lock className="size-4 text-print" aria-hidden /> Sign in to open this course
      </span>
      {auth.status === 'signed-in' ? (
        <>
          <p className="text-sm text-ink-muted">Your sign-in has expired. Renew it to continue.</p>
          <Button icon={<RefreshCw className="size-4" />} loading={renewing} onClick={() => void renew()}>
            Renew sign-in
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-muted">Sign in with {providerNames()} to open every course. The University courses are open to everyone.</p>
          <ButtonLink to={`/sign-in?next=${encodeURIComponent(next)}`} variant="primary" icon={<LogIn className="size-4" />}>
            Sign in
          </ButtonLink>
        </>
      )}
    </div>
  );
}
