import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';


export default function App() {
// Keep auth + provider wrappers here. Do not move routes into feature PRs.
return (
<BrowserRouter>
<AppShell />
</BrowserRouter>
);
}