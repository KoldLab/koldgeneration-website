// src/config/routesConfig.ts
export type RouteConfig = {
  label: string;
  path: string;
  description: string;
  children?: RouteConfig[];
};
export const routesConfig = [
  {
    label: 'Home',
    path: '/',
    description: 'Main landing page',
  },
  {
    label: 'Tools',
    path: '/tools',
    description: 'All personal utilities and scripts',
    children: [
      {
        label: 'Tool 1',
        path: '/tools/tool-1',
        description: 'Description for Tool 1',
      },
      {
        label: 'Tool 2',
        path: '/tools/tool-2',
        description: 'Description for Tool 2',
      },
    ],
  },
];
