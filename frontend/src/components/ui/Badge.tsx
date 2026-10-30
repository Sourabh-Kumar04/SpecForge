import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'amber' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
  className = '',
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.15rem 0.45rem', fontSize: '0.68rem' },
    md: { padding: '0.25rem 0.6rem', fontSize: '0.74rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--bg-surface-elevated)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-default)',
    },
    amber: {
      background: 'var(--accent-forge-subtle)',
      color: 'var(--accent-forge-bright)',
      borderColor: 'var(--border-amber)',
    },
    secondary: {
      background: 'var(--bg-surface)',
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-subtle)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'var(--border-default)',
    },
    success: {
      background: 'var(--color-success-subtle)',
      color: 'var(--color-success-bright)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    warning: {
      background: 'var(--color-warning-subtle)',
      color: 'var(--color-warning-bright)',
      borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    destructive: {
      background: 'var(--color-error-subtle)',
      color: 'var(--color-error-bright)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
  };

  return (
    <span
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={`sf-badge ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
