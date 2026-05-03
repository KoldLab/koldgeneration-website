import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/useMobile';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { getRoutesConfig, type RouteConfig } from '@/routesConfig';
import { useAuth } from '@/contexts/AuthContext';
import LoginButton from '@/components/auth/LoginButton';
import UserMenu from '@/components/auth/UserMenu';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function NavBar() {
  const isMobile = useIsMobile();
  const { user, loading, error } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const routes = getRoutesConfig(t)
    .map((route) => {
      if (route.to === '/workouts' && !user) return null;
      if (route.to === '/tournaments' && route.children) {
        const filteredChildren = route.children.filter(
          (child) =>
            user ||
            (child.to !== '/tournaments/create' && child.to !== '/tournaments/my')
        );
        return { ...route, children: filteredChildren };
      }
      return route;
    })
    .filter((route): route is RouteConfig => route !== null);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Move focus to close button when drawer opens
  useEffect(() => {
    if (drawerOpen) closeButtonRef.current?.focus();
  }, [drawerOpen]);

  const close = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="w-full flex items-center">
      {/* Left: Mobile hamburger */}
      <div className="flex-1 flex items-center sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.openMenu')}
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={[
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t('common.openMenu')}
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-background border-r border-border',
          'transition-transform duration-300 ease-in-out sm:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <Link to="/" onClick={close}>
            <img
              src="/logo.png"
              alt="Logo"
              className="h-10 w-auto shrink-0 invert dark:invert-0"
            />
          </Link>
          <button
            ref={closeButtonRef}
            onClick={close}
            aria-label={t('common.close')}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {routes.map((route) => (
            <MobileItem key={route.title} {...route} onNavigate={close} />
          ))}
        </nav>

        {/* Footer: lang + theme toggles (only when logged out, since UserMenu has them) */}
        {!user && (
          <div className="px-4 py-4 border-t border-border flex items-center gap-3">
            <LanguageSwitcher variant="accordion" />
            <ThemeToggle />
          </div>
        )}
      </div>

      {/* Desktop navigation */}
      <div className="hidden sm:flex flex-1 justify-start items-center">
        <NavigationMenu viewport={isMobile} delayDuration={150}>
          <NavigationMenuList className="items-center gap-2">
            <NavigationMenuItem>
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-10 w-auto shrink-0 invert dark:invert-0"
                />
              </Link>
            </NavigationMenuItem>
            {routes.map((route) => (
              <ListItem key={route.title} {...route} />
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Right: Lang + Theme + Auth */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {!user && (
          <div className="hidden sm:flex items-center gap-3">
            <LanguageSwitcher variant="accordion" />
            <ThemeToggle />
          </div>
        )}
        {loading ? (
          <span className="text-xs text-muted-foreground">{t('common.loading')}</span>
        ) : error ? (
          <span className="text-xs text-destructive">{t('common.error')}</span>
        ) : user ? (
          <UserMenu />
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  );
}

function ListItem({ title, children, to, isSub }: RouteConfig & { isSub?: boolean }) {
  if (!children) {
    return isSub ? (
      <li>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link to={to}>{title}</Link>
        </NavigationMenuLink>
      </li>
    ) : (
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link to={to}>{title}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem className="group/item">
      <NavigationMenuTrigger
        className="group/trigger"
        onPointerDown={(event) => {
          if (event.currentTarget.getAttribute('data-state') === 'open') {
            event.preventDefault();
          }
        }}
      >
        {title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="left-0 w-max min-w-[calc(100%-0px)] [@media(min-width:768px)]:min-w-[var(--trigger-width,auto)]">
        <ul className="grid gap-4">
          {children.map((child) => (
            <ListItem key={child.title} {...child} isSub />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileItem({
  title,
  children,
  to,
  onNavigate,
}: RouteConfig & { onNavigate: () => void }) {
  if (!children) {
    return (
      <Link
        to={to}
        onClick={onNavigate}
        className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        {title}
      </Link>
    );
  }

  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="ml-1 flex flex-col gap-0.5">
        {children.map((child) => (
          <Link
            key={child.title}
            to={child.to}
            onClick={onNavigate}
            className="px-3 py-2.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {child.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
