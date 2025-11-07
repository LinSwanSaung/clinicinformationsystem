import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};

/**
 * Accessible loading spinner built on top of lucide Loader2.
 * - Provides aria-live feedback for screen readers
 * - Supports customizable size, label and inline/block display
 */
export function LoadingSpinner({
  label = 'Loading',
  size = 'md',
  className,
  'aria-live': ariaLive = 'polite',
  inline = false,
}) {
  const spinnerSize = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <div
      className={cn(
        'flex items-center gap-3 text-muted-foreground',
        inline ? 'inline-flex' : 'justify-center',
        className
      )}
      role="status"
      aria-live={ariaLive}
    >
      <Loader2 className={cn('animate-spin text-primary', spinnerSize)} />
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </div>
  );
}

export default LoadingSpinner;
