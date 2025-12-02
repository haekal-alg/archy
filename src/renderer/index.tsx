import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Set document title based on environment
(async () => {
  try {
    const isPackaged = await window.electron.isPackaged();
    document.title = isPackaged ? 'Archy' : '[DEV] Archy';
  } catch (error) {
    console.error('Failed to set document title:', error);
  }
})();

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
