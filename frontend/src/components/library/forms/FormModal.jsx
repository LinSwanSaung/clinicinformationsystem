import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * FormModal with focus trap, validation support, and consistent styling.
 * Works with react-hook-form but can be used with regular forms too.
 */
export function FormModal({
  title,
  description,
  isOpen,
  onOpenChange,
  onSubmit,
  submitText = 'Submit',
  cancelText = 'Cancel',
  children,
  isLoading = false,
  submitDisabled = false,
  className,
  size = 'default',
  formId,
  confirmLoadingText,
}) {
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleTab = (e) => {
      if (e.key !== 'Tab') {
        return;
      }

      const focusableElements = Array.from(
        document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        return !el.disabled && el.offsetParent !== null;
      });

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Focus first element when opened
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      await onSubmit(e);
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-4 py-4">{children}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isLoading}
              ref={firstFocusableRef}
            >
              {cancelText}
            </Button>
            <Button type="submit" disabled={submitDisabled || isLoading} ref={lastFocusableRef}>
              {isLoading ? (confirmLoadingText || 'Submitting...') : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default FormModal;
