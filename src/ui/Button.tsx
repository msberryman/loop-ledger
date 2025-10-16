import React from 'react';
import { tokens } from './tokens';


type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
variant?: 'primary' | 'ghost' | 'danger';
};


export const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
children,
variant = 'primary',
style,
...rest
}) => {
const bg = variant === 'primary' ? tokens.color.brand : variant === 'danger' ? tokens.color.danger : 'transparent';
const color = variant === 'ghost' ? tokens.color.text : '#0a0a0a';
const border = variant === 'ghost' ? `1px solid ${tokens.color.border}` : 'none';
return (
<button
{...rest}
style={{
background: bg,
color,
borderRadius: tokens.radius.md,
padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
border,
cursor: 'pointer',
fontFamily: tokens.font.base,
fontSize: tokens.font.size.base,
...style,
}}
>
{children}
</button>
);
};