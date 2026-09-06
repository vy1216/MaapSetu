import React from 'react';
import { EmptyState } from './EmptyState';
import { Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  emptyIcon = <Inbox className="w-6 h-6" />,
  className = '',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div
      className={`w-full overflow-x-auto rounded-lg border border-[#DCE3ED] bg-white ${className}`}
    >
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#FAFBFD] border-b border-[#DCE3ED] sticky top-0 z-10">
          <tr>
            {columns.map((col) => {
              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';
              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-6 py-3.5 text-xs font-semibold text-[#5B6472] tracking-wider uppercase ${alignClass}`}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCE3ED] text-sm text-[#1A1F29]">
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item, idx)}
              className="hover:bg-[#F9FAFC] transition-colors"
            >
              {columns.map((col) => {
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';
                return (
                  <td
                    key={col.key}
                    className={`px-6 py-3.5 align-middle ${alignClass}`}
                  >
                    {col.render
                      ? col.render(item, idx)
                      : String((item as any)[col.key] ?? '—')}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
