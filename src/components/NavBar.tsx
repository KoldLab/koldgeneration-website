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
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
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
  const routesConfig = getRoutesConfig(t).map((route) => {
    if (route.to === '/tournaments' && route.children) {
      const filteredChildren = route.children.filter((child) => {
        if (!user && (child.to === '/tournaments/create' || child.to === '/tournaments/my')) {
          return false;
        }
        return true;
      });
      return { ...route, children: filteredChildren };
    }
    return route;
  });

  return (
    <div className="w-full flex items-center">
      {/* Left: Mobile menu trigger */}
      <div className="flex-1 flex items-center sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('common.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>{t('common.menu')}</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-2">
              {routesConfig.map((route) => (
                <MobileItem key={route.title} {...route} />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Center: Desktop navigation */}
      <div className="hidden sm:flex flex-1 justify-start items-center ">
        <NavigationMenu viewport={isMobile}>
          <NavigationMenuList className="items-center  gap-2">
            {routesConfig.map((route) => (
              <ListItem key={route.title} {...route} />
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Right: Language + Theme + Auth */}
      <div className="flex-1 flex items-center justify-end gap-3">
        {!user && (
          <>
            <LanguageSwitcher variant="accordion" />
            <ThemeToggle />
          </>
        )}
        {loading ? (
          <span className="text-xs text-muted-foreground">
            {t('common.loading')}
          </span>
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
}: RouteConfig & { isSub?: boolean }) {
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
      <NavigationMenuTrigger className="group/trigger">
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

function MobileItem({ title, children, to }: RouteConfig) {
  if (!children) {
    return (
      <Link
        to={to}
        className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
      >
        {title}
      </Link>
    );
  }
  return (
    <div className="mb-2">
      <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
        {title}
      </div>
      <div className="ml-2 flex flex-col">
        {children.map((child) => (
          <Link
            key={child.title}
            to={child.to}
            className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            {child.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
