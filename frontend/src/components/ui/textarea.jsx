'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'focus-visible:ring-primary/20 flex min-h-[80px] w-full rounded-md border-2 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
