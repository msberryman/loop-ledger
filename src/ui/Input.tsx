import React from 'react';
import { tokens } from './tokens';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  inputRef?: React.Ref<HTMLInputElement>; // ✅ allow a ref to be passed in
};

export const Input: React.FC<Props> = ({ label, style, inputRef, ...rest }) => (
  <label style={{ display: 'grid', gap: tokens.spacing.xs }}>
    {label && (
      <span style={{ color: tokens.color.textMuted, fontSize: tokens.font.size.sm }}>
        {label}
      </span>
    )}
    <input
      ref={inputRef}      // ✅ forward the ref to the native input
      {...rest}
      style={{
        background: '#0e1116',
        color: tokens.color.text,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.sm,
        padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
        fontFamily: tokens.font.base,
        fontSize: tokens.font.size.base,
        outline: 'none',
        ...(style || {}),  // ✅ allow callers to override styles if needed
      }}
    />
  </label>
);
