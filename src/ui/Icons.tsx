import React from 'react';
type P = React.SVGProps<SVGSVGElement>;
const base: P = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const HomeIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 11l9-8 9 8"/><path d="M9 22V12h6v10"/></svg>
);
export const LoopsIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M11 12h2"/></svg>
);
export const ExpensesIcon = (p: P) => (
  <svg {...base} {...p}><path d="M3 6h18"/><path d="M3 10h18"/><path d="M7 14h10"/><path d="M9 18h6"/></svg>
);
export const IncomeIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 3v18"/><path d="M7 7c0-2 10-2 10 0s-10 2-10 4 10 2 10 4-10 2-10 4"/></svg>
);
export const SettingsIcon = (p: P) => (
  <svg {...base} {...p}><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .33 1.7 1.7 0 0 0-.83 1.47V21a2 2 0 1 1-4 0v-.06a1.7 1.7 0 0 0-.83-1.47 1.7 1.7 0 0 0-1-.33 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.33-1 1.7 1.7 0 0 0-1.47-.83H3a2 2 0 1 1 0-4h.06a1.7 1.7 0 0 0 1.47-.83 1.7 1.7 0 0 0 .33-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6c.36 0 .7-.12 1-.33.38-.27.62-.7.83-1.47V3a2 2 0 1 1 4 0v.06c.21.77.45 1.2.83 1.47.3.21.64.33 1 .33a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.27.38-.33.62-.33 1 0 .36.12.7.33 1 .27.38.7.62 1.47.83H21a2 2 0 1 1 0 4h-.06c-.77.21-1.2.45-1.47.83-.21.3-.33.64-.33 1z"/></svg>
);
