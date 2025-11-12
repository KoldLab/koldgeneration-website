import { createBrowserRouter } from 'react-router-dom';
import Tools from './components/pages/Tools';
import Home from './components/pages/Home';
import Layout from './components/Layout';
import MinecraftListGenerator from './components/pages/tools/minecraft list generator/MinecraftListGenerator';
import Timer from './components/pages/tools/timer/Timer';
import CreateTournament from './components/pages/tournaments/CreateTournament';
import TournamentView from './components/pages/tournaments/TournamentView';
import MyTournaments from './components/pages/tournaments/MyTournaments';
import EnterTournament from './components/pages/tournaments/EnterTournament';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';

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
          {
            path: '/tools/timer',
            element: <Timer />,
          },
        ],
      },
      {
        path: '/tournaments/create',
        element: (
          <ProtectedRoute>
            <CreateTournament />
          </ProtectedRoute>
        ),
      },
      {
        path: '/tournaments/my',
        element: (
          <ProtectedRoute>
            <MyTournaments />
          </ProtectedRoute>
        ),
      },
      {
        path: '/tournaments/enter',
        element: <EnterTournament />,
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
