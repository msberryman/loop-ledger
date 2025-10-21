// src/ui/Home.tsx
import React from 'react';
import { tokens } from './tokens';

type Props = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
}>;

/**
 * HomeSection — lightweight UI wrapper for Home page bits.
 * Safe to keep even if unused. Provides both named and default export.
 */
export const HomeSection: React.FC<Props> = ({ children, className, style }) => {
  return (
    <section
      className={className}
      style={{
        display: 'grid',
        gap: tokens.spacing.lg,
        ...style,
      }}
    >
      {children}
    </section>
  );
};

export default HomeSection;
