import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ErrorState component for displaying error messages with retry capability.
 * Supports error, warning, and info variants.
 */
export function ErrorState({
  message = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  type = 'error', // "error", "warning", "info"
  className = '',
  showIcon = true,
  details = null, // Additional technical details
}) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-16 w-16 text-yellow-500" aria-hidden />;
      case 'info':
        return <Info className="h-16 w-16 text-blue-500" aria-hidden />;
      default:
        return <AlertCircle className="h-16 w-16 text-destructive" aria-hidden />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <Card
      className={cn('p-12 text-center', getBgClass(), className)}
      role="alert"
      aria-live="assertive"
    >
      {showIcon && (
        <div className="mb-4 flex justify-center" aria-hidden>
          {getIcon()}
        </div>
      )}

      <p className="mb-2 text-xl font-semibold text-foreground">{message}</p>

      {description && <p className="mb-4 text-lg text-muted-foreground">{description}</p>}

      {details && (
        <div className="mx-auto mb-6 max-w-md rounded-md bg-gray-100 p-3 text-left text-sm text-gray-600">
          <p className="mb-1 font-medium">Technical Details:</p>
          <p className="font-mono text-xs">{details}</p>
        </div>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mx-auto flex items-center gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}

export default ErrorState;
