import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * EmptyState component for displaying when no data is available.
 * Accessible and consistent across the application.
 */
export function EmptyState({
  title = 'No data found',
  description,
  icon: IconComponent,
  action,
  actionLabel,
  className = '',
  children,
}) {
  return (
    <Card className={cn('bg-card p-12 text-center', className)} role="status" aria-live="polite">
      {IconComponent && (
        <div className="mb-4 flex justify-center" aria-hidden>
          <IconComponent className="h-16 w-16 text-muted-foreground" />
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-2 text-lg text-muted-foreground">{description}</p>}
      {action && (
        <div className="mt-6">
          {typeof action === 'function' ? (
            <button onClick={action} className="text-primary hover:underline">
              {actionLabel || 'Get started'}
            </button>
          ) : (
            action
          )}
        </div>
      )}
      {children}
    </Card>
  );
}

export default EmptyState;
