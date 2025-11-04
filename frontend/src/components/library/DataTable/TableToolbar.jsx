import { SearchBar } from '@/components/library';
import { Card } from '@/components/ui/card';

/**
 * TableToolbar: standardized header with search, filters, and actions.
 * - Props:
 *   - searchValue: string
 *   - onSearchChange: (event) => void
 *   - searchPlaceholder?: string
 *   - filters?: React.ReactNode | React.ReactNode[]
 *   - actions?: React.ReactNode
 *   - className?: string
 */
export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  actions,
  className = '',
}) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <div className="max-w-md flex-1">
            <SearchBar
              variant="flat"
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              inputProps={{ className: 'h-10 pl-10' }}
              ariaLabel={searchPlaceholder}
            />
          </div>
          {Array.isArray(filters) ? (
            <div className="flex flex-wrap items-center gap-3">{filters}</div>
          ) : (
            filters || null
          )}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
}

export default TableToolbar;
