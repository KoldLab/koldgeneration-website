import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Clapperboard,
  Dumbbell,
  Home,
  Languages,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Pickaxe,
  Sun,
  Timer,
  Trophy,
  User,
  Wrench,
} from 'lucide-react';
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getRoutesConfig, type RouteConfig } from '@/routesConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import LoginButton from '@/components/auth/LoginButton';
import UserMenu from '@/components/auth/UserMenu';

type NavRoute = RouteConfig & {
  icon: typeof Home;
  locked?: boolean;
  children?: NavRoute[];
};

const routeIcons: Record<string, typeof Home> = {
  '/': Home,
  '/tools': Wrench,
  '/minecraft-tools': Pickaxe,
  '/workouts': Dumbbell,
  '/movies': Clapperboard,
  '/tournaments': Trophy,
  '/notes': NotebookPen,
  '/tools/timer': Timer,
};

export function NavBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, loading, error, signOut, signInWithGoogle } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const routesConfig = useMemo(
    () => getRoutesConfig(t).map((route) => withRouteIcons(route, !user)),
    [t, user]
  );

  const lockTooltip = t('nav.signInRequired');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (signInError) {
      console.error('Error signing in:', signInError);
    }
  };

  return (
    <div className="w-full flex items-center gap-3">
      <div className="flex flex-1 items-center justify-between lg:hidden">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto shrink-0 invert dark:invert-0" />
        </Link>

        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('common.openMenu')}
              className="h-11 w-11 rounded-2xl border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[88vw] max-w-[360px] gap-0 border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          >
            <MobileDrawerNav
              routes={routesConfig}
              pathname={location.pathname}
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              loading={loading}
              error={error}
              user={user}
              theme={theme}
              onToggleTheme={toggleTheme}
              language={i18n.language}
              onChangeLanguage={(language) => void i18n.changeLanguage(language)}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              t={t}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:flex flex-1 justify-start items-center">
        <NavigationMenu viewport={isMobile} delayDuration={150}>
          <NavigationMenuList className="items-center gap-2">
            <NavigationMenuItem>
              <Link to="/">
                <img src="/logo.png" alt="Logo" className="h-10 w-auto shrink-0 invert dark:invert-0" />
              </Link>
            </NavigationMenuItem>
            {routesConfig.map((route) => (
              <ListItem
                key={route.title}
                {...route}
                lockTooltip={lockTooltip}
                onLockedClick={handleSignIn}
              />
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-end gap-3">
        {!user && (
          <>
            <LanguagePicker
              language={i18n.language}
              onChange={(language) => void i18n.changeLanguage(language)}
            />
            <DesktopThemeToggle theme={theme} onToggleTheme={toggleTheme} />
          </>
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

function ListItem({
  title,
  children,
  to,
  isSub,
  locked,
  lockTooltip,
  onLockedClick,
}: NavRoute & {
  isSub?: boolean;
  lockTooltip: string;
  onLockedClick: () => void;
}) {
  const label = (
    <span className="inline-flex items-center gap-1.5">
      <span>{title}</span>
      {locked && (
        <Lock
          className="h-3 w-3 text-muted-foreground"
          aria-label={lockTooltip}
        />
      )}
    </span>
  );

  if (locked) {
    const button = (
      <button
        type="button"
        onClick={onLockedClick}
        title={lockTooltip}
        className={navigationMenuTriggerStyle()}
      >
        {label}
      </button>
    );
    return isSub ? <li>{button}</li> : <NavigationMenuItem>{button}</NavigationMenuItem>;
  }

  if (!children) {
    return isSub ? (
      <li>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link to={to}>{label}</Link>
        </NavigationMenuLink>
      </li>
    ) : (
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link to={to}>{label}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem className="group/item">
      <NavigationMenuTrigger
        className="group/trigger"
        onPointerDown={(event) => {
          const state = event.currentTarget.getAttribute('data-state');
          if (state === 'open') {
            event.preventDefault();
          }
        }}
      >
        {label}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="left-0 w-max min-w-[calc(100%-0px)] [@media(min-width:768px)]:min-w-[var(--trigger-width,auto)]">
        <ul className="grid gap-4">
          {children.map((child: NavRoute) => (
            <ListItem
              key={child.title}
              {...child}
              isSub
              lockTooltip={lockTooltip}
              onLockedClick={onLockedClick}
            />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

interface MobileDrawerNavProps {
  routes: NavRoute[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  user: ReturnType<typeof useAuth>['user'];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: string;
  onChangeLanguage: (language: 'en' | 'fr') => void;
  onSignIn: () => void;
  onSignOut: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function MobileDrawerNav({
  routes,
  pathname,
  isOpen,
  onClose,
  loading,
  error,
  user,
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  onSignIn,
  onSignOut,
  t,
}: MobileDrawerNavProps) {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="flex-row items-center justify-between border-b border-sidebar-border px-5 py-4">
        <SheetTitle className="text-left">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <img src="/logo.png" alt="Logo" className="h-10 w-auto shrink-0 invert dark:invert-0" />
          </Link>
        </SheetTitle>
        <SheetClose asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetClose>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-1.5">
          {routes.map((route) => (
            <MobileNavItem
              key={route.title}
              route={route}
              pathname={pathname}
              shouldAutoExpand={isOpen}
              lockTooltip={t('nav.signInRequired')}
              onLockedClick={() => {
                onClose();
                onSignIn();
              }}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border px-4 py-4">
        {loading ? (
          <p className="px-2 pb-4 text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : error ? (
          <p className="px-2 pb-4 text-sm text-destructive">{t('common.error')}</p>
        ) : user ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 px-3 py-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || t('common.user')}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.displayName || t('common.user')}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>Theme</span>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={onToggleTheme} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4" />
              <span>Language</span>
            </div>
            <LanguagePicker language={language} onChange={onChangeLanguage} />
          </div>
        </div>

        <div className="pt-4">
          {user ? (
            <Button
              variant="ghost"
              onClick={onSignOut}
              className="w-full justify-start gap-2 rounded-xl px-3 py-2.5 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('common.signOut')}</span>
            </Button>
          ) : (
            <Button onClick={onSignIn} className="w-full justify-start gap-2 rounded-xl px-3 py-2.5">
              <LogIn className="h-4 w-4" />
              <span>{t('common.signIn')}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileNavItem({
  route,
  pathname,
  shouldAutoExpand,
  lockTooltip,
  onLockedClick,
}: {
  route: NavRoute;
  pathname: string;
  shouldAutoExpand: boolean;
  lockTooltip: string;
  onLockedClick: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = routeMatches(pathname, route.to);
  const isBranchActive = route.children?.some((child) => routeMatches(pathname, child.to)) ?? false;
  const Icon = route.icon;

  useEffect(() => {
    if (shouldAutoExpand && (isActive || isBranchActive)) {
      setIsOpen(true);
    }
  }, [isActive, isBranchActive, shouldAutoExpand]);

  if (route.locked) {
    return (
      <button
        type="button"
        onClick={onLockedClick}
        title={lockTooltip}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{route.title}</span>
        <Lock
          className="h-3.5 w-3.5 text-muted-foreground"
          aria-label={lockTooltip}
        />
      </button>
    );
  }

  if (!route.children?.length) {
    return (
      <SheetClose asChild>
        <Link
          to={route.to}
          className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{route.title}</span>
        </Link>
      </SheetClose>
    );
  }

  return (
    <div className="rounded-[20px] border border-transparent bg-transparent">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors ${
          isActive || isBranchActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{route.title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1 pl-4">
          {route.children.map((child) => {
            const childActive = routeMatches(pathname, child.to);

            if (child.locked) {
              return (
                <button
                  key={child.title}
                  type="button"
                  onClick={onLockedClick}
                  title={lockTooltip}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current/70" />
                  <span className="flex-1">{child.title}</span>
                  <Lock
                    className="h-3.5 w-3.5 text-muted-foreground"
                    aria-label={lockTooltip}
                  />
                </button>
              );
            }

            return (
              <SheetClose asChild key={child.title}>
                <Link
                  to={child.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    childActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current/70" />
                  <span className="flex-1">{child.title}</span>
                </Link>
              </SheetClose>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LanguagePicker({
  language,
  onChange,
}: {
  language: string;
  onChange: (language: 'en' | 'fr') => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-sidebar-border bg-sidebar p-1">
      {(['en', 'fr'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase transition-colors ${
            language === code
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-muted-foreground hover:text-sidebar-foreground'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

function DesktopThemeToggle({
  theme,
  onToggleTheme,
}: {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch checked={theme === 'dark'} onCheckedChange={onToggleTheme} />
      <Moon className="h-4 w-4" />
    </div>
  );
}

function withRouteIcons(route: RouteConfig, signedOut: boolean): NavRoute {
  return {
    ...route,
    icon: routeIcons[route.to] ?? Home,
    locked: Boolean(route.protected && signedOut),
    children: route.children?.map((child) => withRouteIcons(child, signedOut)),
  };
}

function routeMatches(pathname: string, routeTo: string) {
  if (routeTo === '/') {
    return pathname === '/';
  }

  return pathname === routeTo || pathname.startsWith(`${routeTo}/`);
}
