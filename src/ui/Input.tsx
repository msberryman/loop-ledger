import React from 'react';
import { tokens } from './tokens';


type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string };


export const Input: React.FC<Props> = ({ label, style, ...rest }) => (
<label style={{ display: 'grid', gap: tokens.spacing.xs }}>
{label && <span style={{ color: tokens.color.textMuted, fontSize: tokens.font.size.sm }}>{label}</span>}
<input
{...rest}
style={{
background: '#0e1116',
color: tokens.color.text,
border: `1px solid ${tokens.color.border}`,
borderRadius: tokens.radius.sm,
padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
fontFamily: tokens.font.base,
fontSize: tokens.font.size.base,
outline: 'none'
}}
/>
</label>
);