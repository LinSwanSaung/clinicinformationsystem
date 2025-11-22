import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Toast - Non-blocking notification component following HCI principles
 *
 * Features:
 * - Auto-dismiss for success/info (3-5s)
 * - Manual dismiss for errors (stays until dismissed)
 * - Clear visual cues (colors, icons)
 * - Smooth animations
 * - Accessible (ARIA labels)
 */
export function Toast({ id, type = 'info', title, message, duration = 5000, onClose, action }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss for success, info, warning (not errors)
  useEffect(() => {
    if (type === 'error') return; // Errors stay until manually dismissed

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [type, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const toastStyles = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      titleText: 'text-green-900',
    },
    error: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      titleText: 'text-red-900',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      titleText: 'text-yellow-900',
    },
    info: {
      icon: <Info className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      titleText: 'text-blue-900',
    },
  };

  const style = toastStyles[type] || toastStyles.info;

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300',
        style.bg,
        style.border,
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
    >
      <div className="flex-shrink-0">{style.icon}</div>

      <div className="min-w-0 flex-1">
        {title && <h4 className={cn('mb-1 font-semibold', style.titleText)}>{title}</h4>}
        <p className={cn('text-sm', style.text)}>{message}</p>

        {action && <div className="mt-3">{action}</div>}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 flex-shrink-0 p-0 hover:bg-transparent"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * ToastContainer - Container for displaying multiple toasts
 */
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-4 z-[100] flex w-full max-w-md flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onRemove} />
      ))}
    </div>
  );
}
