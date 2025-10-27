import React from 'react';
import { HashRouter } from 'react-router-dom';
import AppShell from './AppShell';

export default function App() {
  // HashRouter works reliably on GitHub Pages (no server-side routes needed)
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}

