/** The rail's account row: "Sign in" for guests, the account's name and picture once signed in. */
import { LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/cn';
import { type Account, useAuth } from './useAuth';

/** Collapsed (the desktop rail as icons), the row shows only its icon or picture; the label stays for screen readers. */
export function AccountRailItem({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  const row = cn(
    'flex h-10 items-center rounded-lg text-[0.9375rem] transition-colors duration-150 hover:bg-sheet/60',
    collapsed ? 'justify-center' : 'gap-3 px-3',
  );

  if (auth.status === 'guest') {
    return (
      <Link
        to={`/sign-in?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        onClick={onNavigate}
        title="Sign in to save your progress"
        className={`${row} text-print-strong`}
      >
        <LogIn className="size-4" aria-hidden />
        <span className={cn(collapsed && 'sr-only')}>Sign in</span>
      </Link>
    );
  }
  if (auth.status !== 'signed-in') return null;
  return (
    <Link to="/settings" onClick={onNavigate} className={`${row} text-ink-muted hover:text-ink`} title={auth.account.email}>
      <Avatar account={auth.account} />
      <span className={cn('min-w-0 truncate', collapsed && 'sr-only')}>{auth.account.name}</span>
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
