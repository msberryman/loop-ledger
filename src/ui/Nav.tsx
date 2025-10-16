import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { tokens } from './tokens';


export const NAV = [
{ path: '/home', label: 'Home' },
{ path: '/loops', label: 'Loops' },
{ path: '/expenses', label: 'Expenses' },
{ path: '/tips', label: 'Tips' },
{ path: '/settings', label: 'Settings' },
] as const;


export const TopNav: React.FC = () => {
const { pathname } = useLocation();
return (
<nav
style={{
position: 'sticky', top: 0, zIndex: 10,
background: tokens.color.bg,
borderBottom: `1px solid ${tokens.color.border}`,
}}
>
<div style={{ display: 'flex', gap: tokens.spacing.md, padding: tokens.spacing.md, maxWidth: 980, margin: '0 auto' }}>
{NAV.map(item => {
const active = pathname === item.path;
return (
<Link
key={item.path}
to={item.path}
style={{
color: active ? tokens.color.brand : tokens.color.text,
textDecoration: 'none',
padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
borderRadius: tokens.radius.sm,
background: active ? 'rgba(92,200,255,0.12)' : 'transparent',
}}
>{item.label}</Link>
);
})}
</div>
</nav>
);
};