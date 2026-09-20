import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
    <table className={`w-full text-left text-xs border-collapse ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <thead
    className={`bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tr
    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <th className={`px-3.5 py-2.5 font-semibold ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement> & { isMono?: boolean }
> = ({ children, isMono = false, className = '', ...props }) => (
  <td
    className={`px-3.5 py-2.5 text-slate-700 dark:text-slate-300 ${
      isMono ? 'font-mono' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </td>
);
