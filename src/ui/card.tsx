import React from 'react';
import { tokens } from './tokens';

type Props = React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>;

export const Card: React.FC<Props> = ({ children, className, style }) => (
  <div
    className={className}
    style={{
      background: tokens.color.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing.lg,
      boxShadow: tokens.shadow.card,
      border: `1px solid ${tokens.color.border}`,
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;

