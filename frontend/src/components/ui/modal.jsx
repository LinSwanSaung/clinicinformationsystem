import { X } from 'lucide-react';
import { Button } from './button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'default',
  footer,
  className = '',
}) => {
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`w-full rounded-lg bg-white shadow-xl ${sizeClasses[size]} max-h-[90vh] overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">{children}</div>

        {footer && <div className="border-t bg-gray-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export const ModalFooter = ({ children, className = '' }) => (
  <div className={`flex justify-end space-x-3 ${className}`}>{children}</div>
);
