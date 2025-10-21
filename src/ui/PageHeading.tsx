import React from 'react';
export function PageHeading({ label, Icon }: { label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }) {
  return (
    <h1 aria-label={label} style={{ margin: 0, display: 'inline-flex', alignItems: 'center' }}>
      <Icon width={24} height={24} />
    </h1>
  );
}
