/** The rail's account row: "Sign in" for guests, the account's name and picture once signed in. */
import { LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { type Account, useAuth } from './useAuth';

export function AccountRailItem({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth();
  const location = useLocation();
  const row = 'flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors duration-150 hover:bg-sheet/60';

  if (auth.status === 'guest') {
    return (
      <Link
        to={`/sign-in?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        onClick={onNavigate}
        title="Sign in to save your progress"
        className={`${row} text-print-strong`}
      >
        <LogIn className="size-4" aria-hidden />
        <span>Sign in</span>
      </Link>
    );
  }
  if (auth.status !== 'signed-in') return null;
  return (
    <Link to="/settings" onClick={onNavigate} className={`${row} text-ink-muted hover:text-ink`} title={auth.account.email}>
      <Avatar account={auth.account} />
      <span className="min-w-0 truncate">{auth.account.name}</span>
    </Link>
  );
}

export function Avatar({ account, size = 'sm' }: { account: Account; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'size-10 text-base' : 'size-5 text-[0.6875rem]';
  return account.avatarUrl ? (
    <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" className={`${box} shrink-0 rounded-full object-cover`} />
  ) : (
    <span aria-hidden className={`${box} flex shrink-0 items-center justify-center rounded-full bg-print-soft font-semibold text-print-strong`}>
      {account.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
