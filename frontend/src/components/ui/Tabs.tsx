import React from 'react';

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList: React.FC<TabsListProps> = ({ className = '', children, style, ...props }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      ...style,
    }}
    className={`sf-tabs-list ${className}`}
    {...props}
  >
    {children}
  </div>
);

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  className = '',
  active = false,
  children,
  style,
  ...props
}) => (
  <button
    type="button"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.4rem 0.85rem',
      fontSize: '0.8rem',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      borderRadius: 'var(--radius-sm)',
      border: active ? '1px solid var(--border-amber)' : '1px solid transparent',
      background: active ? 'var(--accent-forge-subtle)' : 'transparent',
      color: active ? 'var(--accent-forge-bright)' : 'var(--text-secondary)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      ...style,
    }}
    className={`sf-tabs-trigger ${active ? 'active' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  className = '',
  active = true,
  children,
  style,
  ...props
}) => {
  if (!active) return null;
  return (
    <div
      style={{
        marginTop: '1rem',
        ...style,
      }}
      className={`sf-tabs-content ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
