import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = 'horizontal',
  style,
  className = '',
  ...props
}) => {
  return (
    <div
      style={{
        background: 'var(--border-subtle)',
        ...(orientation === 'horizontal'
          ? { height: '1px', width: '100%', margin: '0.75rem 0' }
          : { width: '1px', height: '100%', margin: '0 0.75rem' }),
        ...style,
      }}
      className={`sf-separator ${className}`}
      {...props}
    />
  );
};
