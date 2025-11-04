import { Card } from '@/components/ui/card';
import { StatusBadge } from '../status/StatusBadge';
import { cn } from '@/lib/utils';

/**
 * Standardized record list item with title, subtitle, meta, status, and optional icon.
 */
export function RecordListItem({
  title,
  subtitle,
  meta,
  status,
  onClick,
  iconSlot,
  className,
  statusVariant,
  children,
}) {
  const content = (
    <Card
      className={cn('transition-shadow hover:shadow-md', onClick && 'cursor-pointer', className)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-start gap-4 p-4">
        {iconSlot && <div className="mt-1 flex-shrink-0">{iconSlot}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
              )}
              {meta && <div className="mt-2 space-y-1 text-xs text-muted-foreground">{meta}</div>}
            </div>
            {status && (
              <div className="flex-shrink-0">
                <StatusBadge status={status} variant={statusVariant} />
              </div>
            )}
          </div>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </Card>
  );

  return content;
}

export default RecordListItem;
