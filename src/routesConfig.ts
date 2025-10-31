// src/config/routesConfig.ts
export type RouteConfig = {
  title: string;
  to: string;
  description: string;
  children?: RouteConfig[];
};
export const routesConfig = [
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
        description: 'Generate a list of Minecraft items',
      },
      {
        title: 'Tool 2',
        to: '/tools/tool-2',
        description: 'Description for Tool 2',
      },
    ],
  },
];
