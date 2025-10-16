import React from 'react';
import { tokens } from './tokens';


export const Card: React.FC<React.PropsWithChildren<{className?: string;}>> = ({ children, className }) => (
<div
className={className}
style={{
background: tokens.color.surface,
borderRadius: tokens.radius.lg,
padding: tokens.spacing.lg,
boxShadow: tokens.shadow.card,
border: `1px solid ${tokens.color.border}`,
}}
>
{children}
</div>
);