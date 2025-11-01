import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import React from 'react';
import { router } from './routes.tsx';

// Handle SPA redirect from 404.html before React Router initializes
// The 404.html redirects to /?/path, we need to extract that and update the URL
if (typeof window !== 'undefined') {
  const search = window.location.search;
  if (search.startsWith('?/')) {
    // Extract the path from query string and update URL
    // Replace ~and~ back to & (rafgraph's solution encodes & as ~and~)
    const redirectPath = search.slice(2).replace(/~and~/g, '&');
    window.history.replaceState(null, '', redirectPath);
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
