import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Shimmer placeholder rows shown while data loads — feels faster than a spinner
// and reserves layout space (no CLS).
function SkeletonRows({ columns, rows = 6 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={`sk-${r}`} className="border-b last:border-0">
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="skeleton h-3.5 rounded" style={{ width: `${55 + ((r + col.key.length) % 4) * 10}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export function DataTable({
  columns,
  data = [],
  loading = false,
  empty = 'No records found',
  rowKey = (r) => r._id,
  onRowClick,
  pagination,
  onPageChange,
}) {
  return (
    <div className="border rounded-lg bg-card overflow-hidden animate-fade-up-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('text-left font-medium px-4 py-3 whitespace-nowrap', col.headerClassName)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows columns={columns} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-muted-foreground animate-fade-in">
                  {empty}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  style={{ animationDelay: `${Math.min(i * 35, 420)}ms` }}
                  className={cn(
                    'border-b last:border-0 transition-colors animate-fade-in hover:bg-muted/40',
                    onRowClick && 'cursor-pointer active:bg-muted/60'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 text-sm">
          <div className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
