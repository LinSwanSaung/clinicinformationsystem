import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DEFAULT_VARIANTS = {
  active: 'default',
  pending: 'default',
  scheduled: 'default',
  completed: 'secondary',
  success: 'secondary',
  resolved: 'secondary',
  cancelled: 'destructive',
  failed: 'destructive',
  error: 'destructive',
  warning: 'outline',
  review: 'outline',
  late: 'outline',
};

/**
 * Status badge with consistent variants and accessible labelling.
 * Falls back to "outline" for unknown statuses.
 */
export function StatusBadge({
  status,
  children,
  variant,
  className,
  map = DEFAULT_VARIANTS,
  icon: Icon,
}) {
  const normalized = (status ?? '').toString().trim().toLowerCase();
  const resolvedVariant = variant ?? map[normalized] ?? 'outline';
  const content = children ?? (status ? status.toString() : 'Unknown');

  return (
    <Badge
      variant={resolvedVariant}
      className={cn('inline-flex items-center gap-1 capitalize', className)}
      aria-live="polite"
    >
      {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
      <span>{content}</span>
    </Badge>
  );
}

export default StatusBadge;
