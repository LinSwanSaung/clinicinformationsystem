import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Search bar with consistent styling, icon support and accessibility.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  icon: Icon = Search,
  className,
  inputProps = {},
  name = 'search',
  ariaLabel = 'Search',
  variant = 'card',
}) {
  const content = (
    <div className="relative" role="search">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={name}
        name={name}
        type="search"
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'h-12 w-full rounded-md border border-input bg-background pl-12 text-base text-foreground placeholder:text-muted-foreground',
          inputProps?.className
        )}
        {...inputProps}
      />
    </div>
  );

  if (variant === 'flat') {
    return <div className={cn('w-full', className)}>{content}</div>;
  }

  return <Card className={cn('bg-card p-4', className)}>{content}</Card>;
}

export default SearchBar;
