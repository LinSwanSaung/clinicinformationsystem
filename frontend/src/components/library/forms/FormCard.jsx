import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Lightweight form wrapper with header, description, and optional action slot.
 */
export function FormCard({
  title,
  description,
  children,
  actionSlot,
  className,
  headerClassName,
  contentClassName,
}) {
  return (
    <Card className={cn('bg-card', className)}>
      <CardHeader
        className={cn('flex flex-row items-center justify-between space-y-0', headerClassName)}
      >
        <div>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {actionSlot && <div className="flex-shrink-0">{actionSlot}</div>}
      </CardHeader>
      {children && (
        <CardContent className={cn('space-y-4', contentClassName)}>{children}</CardContent>
      )}
    </Card>
  );
}

export default FormCard;
