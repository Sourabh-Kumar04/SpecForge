import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          fontSize: '0.88rem',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 0.15s ease',
          ...style,
        }}
        className={`sf-textarea ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
