import React from 'react';
import { tokens } from './tokens';
import { TopNav } from './Nav';


export const Layout: React.FC<React.PropsWithChildren> = ({ children }) => (
<div style={{ minHeight: '100svh', background: tokens.color.bg, color: tokens.color.text, fontFamily: tokens.font.base }}>
<TopNav />
<main style={{ maxWidth: 980, margin: '0 auto', padding: tokens.spacing.lg }}>
{children}
</main>
</div>
);