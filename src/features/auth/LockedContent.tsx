/**
 * Shown in place of members-only content the host refused: a guest is asked to sign in, and a
 * signed-in user who is not a member yet is told how to get added.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Lock, LogIn, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/Feedback';
import { ContentLockedError } from '@/domain/content/load';
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
  const [checking, setChecking] = useState(false);
  const next = `${location.pathname}${location.search}`;

  const checkAgain = async () => {
    setChecking(true);
    try {
      await auth.refreshMembership();
      await queryClient.resetQueries({ queryKey: ['content'] });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 rounded-md border border-rule bg-sheet px-5 py-5">
      <span className="flex items-center gap-2 font-display text-lg font-semibold">
        <Lock className="size-4 text-print" aria-hidden /> This course is for members
      </span>
      {auth.status === 'signed-in' ? (
        <>
          <p className="text-sm text-ink-muted">
            You are signed in{auth.account.email ? <> as <strong className="text-ink">{auth.account.email}</strong></> : null}, but this account is not on the members list
            yet. Ask the owner of this Study Hub to add that email, then check again.
          </p>
          <Button icon={<RefreshCw className="size-4" />} loading={checking} onClick={() => void checkAgain()}>
            Check again
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-muted">Sign in to open it. The University courses are open to everyone.</p>
          <ButtonLink to={`/sign-in?next=${encodeURIComponent(next)}`} variant="primary" icon={<LogIn className="size-4" />}>
            Sign in
          </ButtonLink>
        </>
      )}
    </div>
  );
}
