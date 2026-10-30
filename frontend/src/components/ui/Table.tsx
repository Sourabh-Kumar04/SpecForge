import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <div style={{ width: '100%', overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '0.82rem',
        ...style,
      }}
      className={`sf-table ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <thead
    style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
      ...style,
    }}
    className={`sf-table-header ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <tbody
    style={{
      background: 'var(--bg-card)',
      ...style,
    }}
    className={`sf-table-body ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <tr
    style={{
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background-color 0.12s ease',
      ...style,
    }}
    className={`sf-table-row ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <th
    style={{
      padding: '0.65rem 1rem',
      fontWeight: 700,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary)',
      fontSize: '0.74rem',
      letterSpacing: '0.03em',
      ...style,
    }}
    className={`sf-table-head ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => (
  <td
    style={{
      padding: '0.75rem 1rem',
      color: 'var(--text-primary)',
      verticalAlign: 'middle',
      ...style,
    }}
    className={`sf-table-cell ${className}`}
    {...props}
  >
    {children}
  </td>
);
