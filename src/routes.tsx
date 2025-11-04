import { createBrowserRouter } from 'react-router-dom';
import Tools from './components/pages/Tools';
import Home from './components/pages/Home';
import Layout from './components/Layout';
import MinecraftListGenerator from './components/pages/tools/minecraft list generator/MinecraftListGenerator';
import CreateTournament from './components/pages/tournaments/CreateTournament';
import TournamentView from './components/pages/tournaments/TournamentView';
import MyTournaments from './components/pages/tournaments/MyTournaments';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: '/tools',
        element: <Tools />,
        children: [
          {
            path: '/tools/minecraft-list-generator',
            element: <MinecraftListGenerator />,
          },
        ],
      },
      {
        path: '/tournaments/create',
        element: <CreateTournament />,
      },
      {
        path: '/tournaments/my',
        element: <MyTournaments />,
      },
      {
        path: '/tournament/:code',
        element: <TournamentView />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
