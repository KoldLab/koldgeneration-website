// src/config/routesConfig.ts
import type { TFunction } from 'i18next';

export type RouteConfig = {
  title: string;
  to: string;
  description: string;
  children?: RouteConfig[];
};

export const getRoutesConfig = (t: TFunction): RouteConfig[] => [
  {
    title: t('routes.home.title'),
    to: '/',
    description: t('routes.home.description'),
  },
  {
    title: t('routes.tools.title'),
    to: '/tools',
    description: t('routes.tools.description'),
    children: [
      {
        title: t('routes.tools.minecraftListGenerator.title'),
        to: '/tools/minecraft-list-generator',
        description: t('routes.tools.minecraftListGenerator.description'),
      },
    ],
  },
];

// Legacy export for backwards compatibility (will use default English)
export const routesConfig: RouteConfig[] = [
  {
    title: 'Home',
    to: '/',
    description: 'Main landing page',
  },
  {
    title: 'Tools',
    to: '/tools',
    description: 'All personal utilities and scripts',
    children: [
      {
        title: 'Minecraft List Generator',
        to: '/tools/minecraft-list-generator',
        description:
          'Generate formatted item lists and images from Minecraft chest NBT data',
      },
    ],
  },
];
