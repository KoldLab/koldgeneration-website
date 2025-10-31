import * as React from 'react';
import {
  CircleCheckIcon,
  CircleHelpIcon,
  CircleIcon,
  List,
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
import { Link } from 'react-router-dom';
import { routesConfig, type RouteConfig } from '@/routesConfig';

const components: { title: string; to: string; description: string }[] = [
  {
    title: 'Alert Dialog',
    to: '/docs/primitives/alert-dialog',
    description:
      'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    to: '/docs/primitives/hover-card',
    description:
      'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    to: '/docs/primitives/progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    to: '/docs/primitives/scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    to: '/docs/primitives/tabs',
    description:
      'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    to: '/docs/primitives/tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
];

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
        <ul className="grid w-[300px] gap-4">
          {children.map((child) => (
            <ListItem key={child.title} {...child} isSub />
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
