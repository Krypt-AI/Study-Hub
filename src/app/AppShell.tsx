/**
 * Application frame: the navigation rail and the work area. On large screens the rail can be
 * collapsed to icons (Ctrl+B, remembered per browser) for a wider reading area; on small screens
 * it becomes a drawer behind a top bar.
 */
import {
  Award,
  BookOpen,
  CalendarDays,
  Code2,
  LayoutList,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Search,
  Settings,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { lazy, type ReactNode, Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { IconButton } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/Feedback';
import { useSettings } from '@/data/queries';
import { showsCertifications, showsRoadmaps } from '@/domain/content/visibility';
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
import { useRailCollapsed } from './useRailCollapsed';
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
  { to: '/', label: 'Dashboard', icon: <LayoutList className="size-4" />, end: true },
  { to: '/courses', label: 'Courses', icon: <BookOpen className="size-4" /> },
  { to: '/roadmaps', label: 'Roadmaps', icon: <Route className="size-4" /> },
  { to: '/practice', label: 'Practice', icon: <Target className="size-4" /> },
  { to: '/calendar', label: 'Calendar', icon: <CalendarDays className="size-4" /> },
  { to: '/playground', label: 'Playground', icon: <Code2 className="size-4" /> },
  { to: '/certifications', label: 'Certifications', icon: <Award className="size-4" /> },
];
const PLAYGROUND = '/playground';
const CERTIFICATIONS = '/certifications';
const ROADMAPS = '/roadmaps';

function DueCount({ collapsed }: { collapsed: boolean }) {
  // Only subjects whose study plan schedules reviews count: other subjects never add pressure.
  const { data: states = [] } = usePlannedReviewStates();
  const due = states.filter((state) => isDue(state)).length;
  if (!due) return null;
  if (collapsed) return <span className="absolute top-2 right-2.5 size-2 rounded-full bg-print" aria-label={`${due} reviews due`} />;
  return (
    <span className="tabular ml-auto rounded-full bg-print-soft px-2 text-xs font-medium text-print-strong" aria-label={`${due} reviews due`}>
      {due}
    </span>
  );
}

/** A rail row; collapsed, it shows only its icon and keeps its label for screen readers and as a tooltip. */
const railRow = (collapsed: boolean) =>
  cn('relative flex h-10 items-center rounded-lg text-[0.9375rem] transition-colors duration-150', collapsed ? 'justify-center' : 'gap-3 px-3');

function RailLink({ item, onNavigate, collapsed = false }: { item: NavItem; onNavigate?: () => void; collapsed?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group',
          railRow(collapsed),
          isActive ? 'bg-sheet font-semibold text-ink shadow-[0_1px_3px_rgb(0_0_0/0.08)]' : 'text-ink-muted hover:bg-sheet/60 hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('transition-colors', isActive ? 'text-print' : 'text-ink-faint group-hover:text-ink-muted')}>{item.icon}</span>
          <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
          {item.to === '/practice' && <DueCount collapsed={collapsed} />}
        </>
      )}
    </NavLink>
  );
}

interface RailProps {
  onNavigate?: () => void;
  onSearch: () => void;
  /** Desktop only: icons without labels. */
  collapsed?: boolean;
  /** Desktop only: collapses or expands the rail. */
  onToggle?: () => void;
}

function Rail({ onNavigate, onSearch, collapsed = false, onToggle }: RailProps) {
  const { resolved, setPreference } = useTheme();
  const showPlayground = usePlaygroundInRail();
  const visibility = useVisibility();
  const { pathname } = useLocation();
  const themeLabel = resolved === 'dark' ? 'Day theme' : 'Night theme';
  // Shown while open, so following a link there never leaves the rail without the current page.
  const shown = (item: NavItem) => {
    if (item.to === PLAYGROUND) return showPlayground || pathname.startsWith(PLAYGROUND);
    if (item.to === ROADMAPS) return (visibility !== undefined && showsRoadmaps(visibility)) || pathname.startsWith(ROADMAPS);
    if (item.to === CERTIFICATIONS) return (visibility !== undefined && showsCertifications(visibility)) || pathname.startsWith(CERTIFICATIONS);
    return true;
  };
  return (
    <nav aria-label="Main" className={cn('flex h-full flex-col gap-1 border-r border-rule bg-rail py-4', collapsed ? 'px-2.5' : 'px-3')}>
      <div className={cn('mb-3 flex h-9 items-center', collapsed ? 'justify-center' : 'justify-between gap-2 pl-2.5')}>
        {!collapsed && <span className="font-display text-[1.375rem] leading-none font-bold tracking-tight text-ink">Study Hub</span>}
        {onToggle && (
          <IconButton label={collapsed ? 'Expand menu (Ctrl+B)' : 'Collapse menu (Ctrl+B)'} aria-expanded={!collapsed} onClick={onToggle} className="size-9 text-ink-faint">
            {collapsed ? <PanelLeftOpen className="size-[1.125rem]" /> : <PanelLeftClose className="size-[1.125rem]" />}
          </IconButton>
        )}
      </div>
      <button
        type="button"
        onClick={onSearch}
        title={collapsed ? 'Search (Ctrl+K)' : undefined}
        className={cn(
          'mb-3 flex h-10 items-center rounded-lg bg-sheet text-sm text-ink-faint transition-colors hover:text-ink-muted',
          collapsed ? 'justify-center' : 'gap-2 px-3',
        )}
      >
        <Search className="size-4" aria-hidden />
        <span className={cn(collapsed && 'sr-only')}>Search</span>
      </button>
      {NAV.filter(shown).map((item) => (
        <RailLink key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />
      ))}
      <div className="mt-auto flex flex-col gap-1 pt-3">
        <AccountRailItem onNavigate={onNavigate} collapsed={collapsed} />
        <RailLink item={{ to: '/settings', label: 'Settings', icon: <Settings className="size-4" /> }} onNavigate={onNavigate} collapsed={collapsed} />
        <button
          type="button"
          onClick={() => setPreference(resolved === 'dark' ? 'light' : 'dark')}
          title={collapsed ? themeLabel : undefined}
          className={cn(railRow(collapsed), 'text-ink-muted hover:bg-sheet/60 hover:text-ink')}
        >
          {resolved === 'dark' ? <Sun className="size-4 text-ink-faint" aria-hidden /> : <Moon className="size-4 text-ink-faint" aria-hidden />}
          <span className={cn(collapsed && 'sr-only')}>{themeLabel}</span>
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
  const [railCollapsed, toggleRail] = useRailCollapsed();
  useStudyTimer();

  // A page opened by a link starts at its top, as in a new page (a link to a section, "#id", keeps its place).
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

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
    <div
      className={cn(
        'min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-200 lg:ease-out print:block',
        railCollapsed ? 'lg:grid-cols-[4.25rem_minmax(0,1fr)]' : 'lg:grid-cols-[15rem_minmax(0,1fr)]',
      )}
    >
      <a href="#main" className="sr-only z-50 rounded-md bg-print px-3 py-2 text-on-print focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <div className="sticky top-0 hidden h-dvh lg:block print:hidden">
        <Rail onSearch={() => setSearchOpen(true)} collapsed={railCollapsed} onToggle={toggleRail} />
      </div>

      <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-rule bg-rail px-3 lg:hidden print:hidden">
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

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-12 lg:py-10 print:p-0">
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
