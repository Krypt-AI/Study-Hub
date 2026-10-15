/** Settings: who is signed in, with which providers, and sign-out. */
import { LogIn, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Feedback';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from './AccountRailItem';
import { PROVIDER_LABELS, providerNames } from './signInOptions';
import { type OAuthProviderId, useAuth } from './useAuth';

const providerLabel = (provider: string) => PROVIDER_LABELS[provider as OAuthProviderId] ?? (provider === 'email' ? 'Email' : provider);

export function AccountSheet() {
  const auth = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (auth.status === 'guest') {
    return (
      <Sheet title="Your account">
        <div className="flex flex-col gap-3 text-sm">
          <p>You are studying as a guest. Your progress is saved on this device only, for each profile on it.</p>
          <p className="text-ink-muted">Sign in with {providerNames()} to open every course and keep your progress, reviews and code in your account, on any device.</p>
          <ButtonLink to="/sign-in?next=%2Fsettings" variant="primary" icon={<LogIn className="size-4" />} className="self-start">
            Sign in
          </ButtonLink>
        </div>
      </Sheet>
    );
  }
  if (auth.status !== 'signed-in') return null;
  const { account } = auth;

  const signOut = async () => {
    setSigningOut(true);
    try {
      await auth.signOut();
    } finally {
      setSigningOut(false);
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
        <p className="text-ink-muted">Every course is open to you. Your progress, calendar and code are saved to your account; only you can read or change them.</p>
        <Button size="sm" icon={<LogOut className="size-4" />} loading={signingOut} onClick={() => void signOut()} className="self-start">
          Sign out
        </Button>
      </div>
    </Sheet>
  );
}
