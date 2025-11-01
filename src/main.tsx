import { createRoot } from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router';
import React from 'react';
import { router } from './routes.tsx';

// Check for redirect path before rendering
if (typeof window !== 'undefined') {
  const redirectPath = sessionStorage.getItem('redirectPath');
  if (redirectPath) {
    sessionStorage.removeItem('redirectPath');
    // Use window.location to navigate, preserving the full path
    window.history.replaceState(null, '', redirectPath);
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
