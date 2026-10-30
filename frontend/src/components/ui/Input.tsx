import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          width: '100%',
          padding: '0.55rem 0.85rem',
          fontSize: '0.86rem',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          ...style,
        }}
        className={`sf-input ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
