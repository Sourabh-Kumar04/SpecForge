import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', isLoading = false, children, disabled, style, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.45rem',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      border: '1px solid transparent',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      verticalAlign: 'middle',
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '0.3rem 0.65rem', fontSize: '0.78rem' },
      md: { padding: '0.5rem 1rem', fontSize: '0.84rem' },
      lg: { padding: '0.65rem 1.4rem', fontSize: '0.92rem' },
      icon: { padding: '0.4rem', width: '32px', height: '32px' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        background: 'var(--accent-forge)',
        color: '#ffffff',
        borderColor: 'var(--accent-forge)',
      },
      secondary: {
        background: 'var(--bg-surface-elevated)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-default)',
      },
      outline: {
        background: 'transparent',
        color: 'var(--text-secondary)',
        borderColor: 'var(--border-default)',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--text-secondary)',
        borderColor: 'transparent',
      },
      destructive: {
        background: 'var(--color-error)',
        color: '#ffffff',
        borderColor: 'var(--color-error)',
      },
      success: {
        background: 'var(--color-success)',
        color: '#ffffff',
        borderColor: 'var(--color-success)',
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          ...baseStyle,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        className={`sf-button ${className}`}
        {...props}
      >
        {isLoading && <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
