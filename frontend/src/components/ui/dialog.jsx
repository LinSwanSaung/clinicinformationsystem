import { useEffect, forwardRef, Children, cloneElement } from 'react';
import { cn } from '@/lib/utils';

const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onOpenChange) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {children}
    </div>
  );
};

const DialogContent = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

const DialogTrigger = forwardRef(({ asChild = false, children, onClick }, ref) => {
  const child = Children.only(children);
  if (asChild) {
    return cloneElement(child, {
      ref,
      onClick: (event) => {
        child.props?.onClick?.(event);
        onClick?.(event);
      },
    });
  }
  return (
    <button ref={ref} onClick={onClick}>
      {children}
    </button>
  );
});
DialogTrigger.displayName = 'DialogTrigger';

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
