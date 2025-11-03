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
import { routesConfig, type RouteConfig } from '@/routesConfig';
import { useAuth } from '@/contexts/AuthContext';
import LoginButton from '@/components/auth/LoginButton';
import UserMenu from '@/components/auth/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';

export function NavBar() {
  const isMobile = useIsMobile();
  const { user, loading, error } = useAuth();

  return (
    <div className="w-full flex items-center">
      {/* Left: Mobile menu trigger */}
      <div className="flex-1 flex items-center sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
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

      {/* Right: Theme + Auth */}
      <div className="flex-1 flex items-center justify-end gap-3">
        <ThemeToggle />
        {loading ? (
          <span className="text-xs text-muted-foreground">Loading...</span>
        ) : error ? (
          <span className="text-xs text-destructive">Auth Error</span>
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
    <NavigationMenuItem>
      <NavigationMenuTrigger>{title}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[280px] sm:w-[300px] gap-4">
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
