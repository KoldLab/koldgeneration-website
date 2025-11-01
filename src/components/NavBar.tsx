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
import { routesConfig, type RouteConfig } from '@/routesConfig';

export function NavBar() {
  const isMobile = useIsMobile();

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        {routesConfig.map((route) => (
          <ListItem key={route.title} {...route} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
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
