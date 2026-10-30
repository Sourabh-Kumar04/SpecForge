import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'accent';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, style, ...props }, ref) => {
    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        background: 'var(--bg-card)',
        borderColor: 'var(--border-default)',
      },
      elevated: {
        background: 'var(--bg-surface-elevated)',
        borderColor: 'var(--border-default)',
      },
      subtle: {
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      },
      accent: {
        background: 'var(--bg-card)',
        borderColor: 'var(--border-amber)',
      },
    };

    return (
      <div
        ref={ref}
        style={{
          borderRadius: 'var(--radius-md)',
          border: '1px solid',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          ...variantStyles[variant],
          ...style,
        }}
        className={`sf-card ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <div
    style={{
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem',
      ...style,
    }}
    className={`sf-card-header ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <h3
    style={{
      margin: 0,
      fontSize: '1rem',
      fontWeight: 700,
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em',
      ...style,
    }}
    className={`sf-card-title ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <p
    style={{
      margin: 0,
      fontSize: '0.82rem',
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
      ...style,
    }}
    className={`sf-card-desc ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <div
    style={{
      padding: '0 1.5rem 1.25rem 1.5rem',
      ...style,
    }}
    className={`sf-card-content ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <div
    style={{
      padding: '1rem 1.5rem',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
      ...style,
    }}
    className={`sf-card-footer ${className}`}
    {...props}
  >
    {children}
  </div>
);
