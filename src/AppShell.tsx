import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './ui/Layout';
import HomePage from './pages/Home';
import LoopsPage from './pages/Loops';
import ExpensesPage from './pages/Expenses';
import IncomePage from './pages/Income';
import SettingsPage from './pages/Settings';

export default function AppShell() {
  return (
    <Layout>
      <Routes>
        {/* NEW: if path is exactly the base ("/"), send to /home */}
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route path="/home" element={<HomePage />} />
        <Route path="/loops" element={<LoopsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Keep the wildcard as a safety net */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
}
