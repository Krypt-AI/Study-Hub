/**
 * Application frame: the navigation rail (a sheet's left margin, one bubble per
 * destination, the current one filled) and the work area. On small screens the rail
 * becomes a drawer behind a top bar.
 */
import {
  Award,
  BookOpen,
  CalendarDays,
  Code2,
  LayoutList,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { lazy, type ReactNode, Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { IconButton } from '@/components/ui/Button';
import { Kbd, LoadingState } from '@/components/ui/Feedback';
import { useSettings } from '@/data/queries';
import { showsCertifications } from '@/domain/content/visibility';
import { isDue } from '@/domain/learning/due';
import { AccountRailItem } from '@/features/auth/AccountRailItem';
import { canOpenLockedContent, useAuth } from '@/features/auth/useAuth';
import { BringDeviceProgress } from '@/features/learners/BringDeviceProgress';
import { cn } from '@/lib/cn';
import { useStudyTimer } from '@/features/today/useStudyTimer';
import { usePlaygroundInRail } from '@/features/playground/usePlaygroundInRail';
import { ExtrasChoicePage } from '@/features/profile/ExtrasChoicePage';
import { WelcomePage } from '@/features/profile/WelcomePage';
import { usePlannedReviewStates, useVisibility } from '@/features/profile/useVisibility';
import { useTheme } from './useTheme';

// Search loads its index library only when first opened.
const SearchDialog = lazy(() => import('@/features/search/SearchDialog').then((module) => ({ default: module.SearchDialog })));

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Today', icon: <LayoutList className="size-4" />, end: true },
  { to: '/courses', label: 'Courses', icon: <BookOpen className="size-4" /> },
  { to: '/practice', label: 'Practice', icon: <Target className="size-4" /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarDays className="size-4" /> },
  { to: '/playground', label: 'Playground', icon: <Code2 className="size-4" /> },
  { to: '/certifications', label: 'Certifications', icon: <Award className="size-4" /> },
];
const PLAYGROUND = '/playground';
const CERTIFICATIONS = '/certifications';

function DueCount() {
  // Only subjects whose study plan schedules reviews count: other subjects never add pressure.
  const { data: states = [] } = usePlannedReviewStates();
  const due = states.filter((state) => isDue(state)).length;
  if (!due) return null;
  return (
    <span className="tabular ml-auto rounded-sm bg-print-soft px-1.5 text-xs font-medium text-print-strong" aria-label={`${due} reviews due`}>
      {due}
    </span>
  );
}

function RailLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors duration-150',
          isActive ? 'bg-sheet font-semibold text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]' : 'text-ink-muted hover:bg-sheet/60 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('transition-colors', isActive ? 'text-print' : 'text-ink-faint group-hover:text-ink-muted')}>{item.icon}</span>
          <span>{item.label}</span>
          {item.to === '/practice' && <DueCount />}
        </>
      )}
    </NavLink>
  );
}

function Rail({ onNavigate, onSearch }: { onNavigate?: () => void; onSearch: () => void }) {
  const { resolved, setPreference } = useTheme();
  const showPlayground = usePlaygroundInRail();
  const visibility = useVisibility();
  const { pathname } = useLocation();
  // Shown while open, so following a link there never leaves the rail without the current page.
  const shown = (item: NavItem) => {
    if (item.to === PLAYGROUND) return showPlayground || pathname.startsWith(PLAYGROUND);
    if (item.to === CERTIFICATIONS) return (visibility !== undefined && showsCertifications(visibility)) || pathname.startsWith(CERTIFICATIONS);
    return true;
  };
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-1 border-r border-print-line bg-rail px-3 py-4">
      <div className="mb-3 flex items-baseline gap-2 px-2.5">
        <span className="font-display text-[1.375rem] leading-none font-semibold tracking-tight text-ink">Study Hub</span>
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="mb-3 flex h-9 items-center gap-2 rounded-md border border-rule-strong bg-sheet px-2.5 text-sm text-ink-faint transition-colors hover:border-print-line hover:text-ink-muted"
      >
        <Search className="size-4" aria-hidden />
        Search
        <span className="ml-auto">
          <Kbd>Ctrl K</Kbd>
        </span>
      </button>
      {NAV.filter(shown).map((item) => (
        <RailLink key={item.to} item={item} onNavigate={onNavigate} />
      ))}
      <div className="mt-auto flex flex-col gap-1 border-t border-rule pt-3">
        <AccountRailItem onNavigate={onNavigate} />
        <RailLink item={{ to: '/settings', label: 'Settings', icon: <Settings className="size-4" /> }} onNavigate={onNavigate} />
        <button
          type="button"
          onClick={() => setPreference(resolved === 'dark' ? 'light' : 'dark')}
          className="flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] text-ink-muted transition-colors hover:bg-sheet/60 hover:text-ink"
        >
          {resolved === 'dark' ? <Sun className="size-4 text-ink-faint" aria-hidden /> : <Moon className="size-4 text-ink-faint" aria-hidden />}
          {resolved === 'dark' ? 'Day theme' : 'Night theme'}
        </button>
      </div>
    </nav>
  );
}

/**
 * Whichever page they opened, a learner without a profile answers the Welcome page first, and one who
 * can choose extras (signed in, or local mode) is then asked once what they want to study.
 */
export function AppShell() {
  const settings = useSettings();
  const auth = useAuth();
  if (settings.isPending || auth.status === 'loading') return <LoadingState className="min-h-dvh justify-center" />;
  if (settings.data && !settings.data.profile) return <WelcomePage settings={settings.data} />;
  if (settings.data && canOpenLockedContent(auth) && !settings.data.extrasChosen) return <ExtrasChoicePage settings={settings.data} />;
  return <AppFrame />;
}

function AppFrame() {
  const location = useLocation();
  // The drawer belongs to the page it was opened on: navigating anywhere closes it.
  const [drawerPath, setDrawerPath] = useState<string>();
  const drawerOpen = drawerPath === location.pathname;
  const closeDrawer = () => setDrawerPath(undefined);
  const [searchOpen, setSearchOpen] = useState(false);
  useStudyTimer();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] print:block">
      <a href="#main" className="sr-only z-50 rounded-md bg-print px-3 py-2 text-on-print focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <div className="sticky top-0 hidden h-dvh lg:block print:hidden">
        <Rail onSearch={() => setSearchOpen(true)} />
      </div>

      <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-print-line bg-rail px-3 lg:hidden print:hidden">
        <IconButton label="Open navigation" onClick={() => setDrawerPath(location.pathname)}>
          <Menu className="size-5" />
        </IconButton>
        <span className="font-display text-lg font-semibold">Study Hub</span>
        <IconButton label="Search" className="ml-auto" onClick={() => setSearchOpen(true)}>
          <Search className="size-5" />
        </IconButton>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/50" onClick={() => closeDrawer()} />
          <div className="relative h-full w-64 shadow-sheet">
            <Rail onNavigate={() => closeDrawer()} onSearch={() => setSearchOpen(true)} />
            <IconButton label="Close navigation" className="absolute top-3 right-3" onClick={() => closeDrawer()}>
              <X className="size-5" />
            </IconButton>
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 print:p-0">
        <BringDeviceProgress />
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>

      {searchOpen && (
        <Suspense fallback={null}>
          <SearchDialog open onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
