import React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'default',
  footer,
  className = ''
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden ${className}`}>
        <div className="flex justify-between items-center p-6 border-b">
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
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const ModalFooter = ({ children, className = "" }) => (
  <div className={`flex justify-end space-x-3 ${className}`}>
    {children}
  </div>
);
