import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * Reusable Modal Component
 * Used for forms and dialogs throughout the application
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSave, 
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  saveDisabled = false,
  loading = false,
  size = "md" // sm, md, lg, xl
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl"
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} m-4`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
        
        {/* Footer */}
        {(onSave || onCancel) && (
          <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50 rounded-b-lg">
            {onCancel && (
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2"
              >
                {cancelText}
              </Button>
            )}
            {onSave && (
              <Button 
                onClick={onSave}
                disabled={saveDisabled || loading}
                className="px-4 py-2"
              >
                {loading ? 'Saving...' : saveText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;