import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '../feedback/LoadingSpinner';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DataTable kit with sorting, pagination, and keyboard navigation.
 * Supports both client-side and server-side pagination.
 */
export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyText = 'No data available',
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onSortChange,
  toolbarSlot,
  className,
  rowClassName,
  onRowClick,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  });

  // Calculate pagination
  const totalPages =
    total !== undefined ? Math.ceil(total / pageSize) : Math.ceil(data.length / pageSize);
  const isServerSide = total !== undefined;
  const displayData = isServerSide ? data : data.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (columnKey) => {
    if (!onSortChange) {
      return;
    }

    const newDirection =
      sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';

    setSortConfig({ key: columnKey, direction: newDirection });
    onSortChange({ key: columnKey, direction: newDirection });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) {
      return;
    }
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleKeyDown = (e, rowData, rowIndex) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onRowClick) {
        onRowClick(rowData, rowIndex);
      }
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {toolbarSlot && <div className="flex items-center justify-between">{toolbarSlot}</div>}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const isSortable = column.sortable !== false && onSortChange;
                const isSorted = sortConfig.key === column.key;
                const sortDirection = isSorted ? sortConfig.direction : null;

                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.className,
                      isSortable && 'hover:bg-muted/50 cursor-pointer select-none'
                    )}
                    onClick={() => isSortable && handleSort(column.key)}
                    onKeyDown={(e) => {
                      if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleSort(column.key);
                      }
                    }}
                    tabIndex={isSortable ? 0 : -1}
                    role={isSortable ? 'button' : undefined}
                    aria-sort={
                      isSortable
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : sortDirection === 'desc'
                            ? 'descending'
                            : 'none'
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {isSortable && (
                        <span className="inline-flex flex-col">
                          <ArrowUp
                            className={cn(
                              'h-3 w-3',
                              sortDirection === 'asc'
                                ? 'text-primary'
                                : 'text-muted-foreground opacity-30'
                            )}
                            aria-hidden
                          />
                          <ArrowDown
                            className={cn(
                              '-mt-1 h-3 w-3',
                              sortDirection === 'desc'
                                ? 'text-primary'
                                : 'text-muted-foreground opacity-30'
                            )}
                            aria-hidden
                          />
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12">
                  <LoadingSpinner label="Loading data..." size="lg" />
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row, rowIndex) => (
                <TableRow
                  key={row.id || rowIndex}
                  className={cn(onRowClick && 'cursor-pointer', rowClassName?.(row, rowIndex))}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  onKeyDown={(e) => handleKeyDown(e, row, rowIndex)}
                  tabIndex={onRowClick ? 0 : -1}
                  role={onRowClick ? 'button' : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.cellClassName}>
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {isServerSide ? (page - 1) * pageSize + 1 : (page - 1) * pageSize + 1} to{' '}
            {isServerSide
              ? Math.min(page * pageSize, total)
              : Math.min(page * pageSize, data.length)}{' '}
            of {isServerSide ? total : data.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || isLoading}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
