import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Dashboard statistic card with optional icon and metadata.
 */
export function StatCard({ title, value, icon: Icon, helperText, trend, className, children }) {
  return (
    <Card className={cn('bg-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon ? <Icon className="h-6 w-6 text-muted-foreground" aria-hidden /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground" aria-live="polite">
          {value}
        </div>
        {trend ? (
          <p className="text-sm text-emerald-600" role="status">
            {trend}
          </p>
        ) : null}
        {helperText ? <p className="mt-1 text-sm text-muted-foreground">{helperText}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}

export default StatCard;
