/** Settings: who is signed in, with which providers, whether they are a member, and sign-out. */
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from './AccountRailItem';
import { PROVIDER_LABELS } from './signInOptions';
import { type OAuthProviderId, useAuth } from './useAuth';

const providerLabel = (provider: string) => PROVIDER_LABELS[provider as OAuthProviderId] ?? (provider === 'email' ? 'Email' : provider);

export function AccountSheet() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'refresh' | 'sign-out'>();

  if (auth.status === 'guest') {
    return (
      <Sheet title="Your account">
        <div className="flex flex-col gap-3 text-sm">
          <p>You are browsing as a guest. Progress made now is kept only until you close or reload the page.</p>
          <p className="text-ink-muted">Sign in with Google, Discord or GitHub to save your progress, reviews and code to your account.</p>
          <ButtonLink to="/sign-in?next=%2Fsettings" variant="primary" icon={<LogIn className="size-4" />} className="self-start">
            Sign in
          </ButtonLink>
        </div>
      </Sheet>
    );
  }
  if (auth.status !== 'signed-in') return null;
  const { account } = auth;

  const run = async (action: 'refresh' | 'sign-out') => {
    setBusy(action);
    try {
      if (action === 'sign-out') await auth.signOut();
      else {
        await auth.refreshMembership();
        await queryClient.resetQueries({ queryKey: ['content'] });
      }
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <Sheet title="Your account">
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex items-center gap-3">
          <Avatar account={account} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{account.name}</p>
            {account.email && <p className="truncate text-ink-muted">{account.email}</p>}
          </div>
        </div>
        {account.providers.length > 0 && (
          <p className="text-ink-muted">
            Signed in with{' '}
            {account.providers.map((provider) => (
              <Tag key={provider} className="mr-1">
                {providerLabel(provider)}
              </Tag>
            ))}
          </p>
        )}
        <p>
          {account.member ? (
            <>
              <Tag tone="print">Member</Tag> Every course is open to you.
            </>
          ) : (
            <>Not on the members list yet: the University courses are open, the others need the owner of this Study Hub to add your email.</>
          )}
        </p>
        <p className="text-ink-muted">Your progress, calendar and code are saved to your account. Only you can read or change them.</p>
        <div className="flex flex-wrap gap-2">
          {!account.member && (
            <Button size="sm" icon={<RefreshCw className="size-4" />} loading={busy === 'refresh'} onClick={() => void run('refresh')}>
              Check membership again
            </Button>
          )}
          <Button size="sm" icon={<LogOut className="size-4" />} loading={busy === 'sign-out'} onClick={() => void run('sign-out')}>
            Sign out
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
