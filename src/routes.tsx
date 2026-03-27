import { createBrowserRouter } from 'react-router-dom';
import Tools from './components/pages/Tools';
import Home from './components/pages/Home';
import Layout from './components/Layout';
import MinecraftListGenerator from './components/pages/tools/minecraft list generator/MinecraftListGenerator';
import Timer from './components/pages/tools/timer/Timer';
import MazeGenerator from './components/pages/tools/maze-generator/MazeGenerator';
import CreateTournament from './components/pages/tournaments/CreateTournament';
import TournamentView from './components/pages/tournaments/TournamentView';
import MyTournaments from './components/pages/tournaments/MyTournaments';
import EnterTournament from './components/pages/tournaments/EnterTournament';
import ExerciseLibrary from './components/pages/workouts/ExerciseLibrary';
import Workouts from './components/pages/workouts/Workouts';
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
            path: '/tools/timer',
            element: <Timer />,
          },
          {
            path: '/tools/maze-generator',
            element: <MazeGenerator />,
          },
        ],
      },
      {
        path: '/minecraft-tools',
        element: <Tools />,
        children: [
          {
            path: '/minecraft-tools/list-generator',
            element: <MinecraftListGenerator />,
          },
        ],
      },
      {
        path: '/workouts',
        element: (
          <ProtectedRoute>
            <Workouts />
          </ProtectedRoute>
        ),
      },
      {
        path: '/workouts/exercises',
        element: (
          <ProtectedRoute>
            <ExerciseLibrary />
          </ProtectedRoute>
        ),
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
