import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';

export default function App() {
  // Vite sets BASE_URL; in dev it's "/" and in prod it's "/loop-ledger/"
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell />
    </BrowserRouter>
  );
}
