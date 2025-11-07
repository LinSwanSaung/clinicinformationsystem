import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Alert = ({ title, message, type = 'success', onClose, onConfirm, showConfirm = false }) => {
  const alertStyles = {
    success: {
      icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
      bg: 'bg-green-50',
      border: 'border-green-100',
      text: 'text-green-800',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
    error: {
      icon: <XCircle className="h-6 w-6 text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertCircle className="h-6 w-6 text-yellow-500" />,
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      text: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
  };

  const style = alertStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className={`w-full max-w-md ${style.bg} ${style.border} p-6 shadow-lg`}>
        <div className="flex items-start gap-4">
          {style.icon}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${style.text}`}>{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {showConfirm && (
            <Button onClick={onConfirm} className={style.button}>
              Confirm
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {showConfirm ? 'Cancel' : 'Close'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Alert;
