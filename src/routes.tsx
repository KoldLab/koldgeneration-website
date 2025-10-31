import { createBrowserRouter } from 'react-router-dom';
import Tools from './components/pages/Tools';
import Home from './components/pages/Home';
import Layout from './components/Layout';
import MinecraftListGenerator from './components/pages/tools/minecraft list generator/MinecraftListGenerator';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
    ],
  },
]);
