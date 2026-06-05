// src/config/routesConfig.ts
import type { TFunction } from 'i18next';

export type RouteConfig = {
  title: string;
  to: string;
  description: string;
  protected?: boolean;
  /** When true, `to` is an absolute URL opened as a normal link instead of a client-side route. */
  external?: boolean;
  children?: RouteConfig[];
};

/** The workout feature now lives on its own subdomain. */
export const WORKOUTS_URL = 'https://workout.koldgeneration.com';

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
        title: t('routes.tools.timer.title'),
        to: '/tools/timer',
        description: t('routes.tools.timer.description'),
      },
      {
        title: t('routes.tools.mazeGenerator.title'),
        to: '/tools/maze-generator',
        description: t('routes.tools.mazeGenerator.description'),
      },
      {
        title: t('routes.tools.volleyballTeamMaker.title'),
        to: '/tools/volleyball-team-maker',
        description: t('routes.tools.volleyballTeamMaker.description'),
        protected: true,
      },
    ],
  },
  {
    title: t('routes.minecraftTools.title'),
    to: '/minecraft-tools',
    description: t('routes.minecraftTools.description'),
    children: [
      {
        title: t('routes.minecraftTools.listGenerator.title'),
        to: '/minecraft-tools/list-generator',
        description: t('routes.minecraftTools.listGenerator.description'),
      },
      {
        title: t('routes.minecraftTools.shulkerGenerator.title'),
        to: '/minecraft-tools/shulker-generator',
        description: t('routes.minecraftTools.shulkerGenerator.description'),
      },
    ],
  },
  {
    title: t('routes.workouts.title'),
    to: WORKOUTS_URL,
    description: t('routes.workouts.description'),
    external: true,
  },
  {
    title: t('routes.marathons.title'),
    to: '/movies',
    description: t('routes.marathons.description'),
    children: [
      {
        title: t('routes.marathons.movies.title'),
        to: '/movies',
        description: t('routes.marathons.movies.description'),
      },
      {
        title: t('routes.marathons.marathons.title'),
        to: '/marathons',
        description: t('routes.marathons.marathons.description'),
      },
    ],
  },
  {
    title: t('routes.tournaments.title'),
    to: '/tournaments',
    description: t('routes.tournaments.description'),
    children: [
      {
        title: t('routes.tournaments.create.title'),
        to: '/tournaments/create',
        description: t('routes.tournaments.create.description'),
        protected: true,
      },
      {
        title: t('routes.tournaments.my.title'),
        to: '/tournaments/my',
        description: t('routes.tournaments.my.description'),
        protected: true,
      },
      {
        title: t('routes.tournaments.enter.title'),
        to: '/tournaments/enter',
        description: t('routes.tournaments.enter.description'),
      },
    ],
  },
  {
    title: t('routes.notes.title'),
    to: '/notes',
    description: t('routes.notes.description'),
    protected: true,
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
        title: 'Timer',
        to: '/tools/timer',
        description: 'Stopwatch and countdown timer with precision timing',
      },
      {
        title: 'Maze generator',
        to: '/tools/maze-generator',
        description: 'Generate printable perfect mazes for games and puzzles',
      },
    ],
  },
  {
    title: 'Minecraft Tools',
    to: '/minecraft-tools',
    description: 'Tools for Minecraft content creation',
    children: [
      {
        title: 'Chest Contents Image Generator',
        to: '/minecraft-tools/list-generator',
        description:
          'Create customizable images showing the contents of your Minecraft chest',
      },
      {
        title: 'Shulker Box Command Generator',
        to: '/minecraft-tools/shulker-generator',
        description:
          'Generate /give commands for shulker boxes pre-filled with items from a Litematica material list',
      },
    ],
  },
  {
    title: 'Tournaments',
    to: '/tournaments',
    description: 'Create and manage tournaments',
    children: [
      {
        title: 'Create Tournament',
        to: '/tournaments/create',
        description: 'Create a new tournament',
        protected: true,
      },
      {
        title: 'My Tournaments',
        to: '/tournaments/my',
        description: 'View all tournaments you have participated in',
        protected: true,
      },
      {
        title: 'Enter Tournament Code',
        to: '/tournaments/enter',
        description: 'Join or view a tournament by entering its code',
      },
    ],
  },
];
