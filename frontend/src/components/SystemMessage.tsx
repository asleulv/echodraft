import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { SystemMessage as SystemMessageType } from '@/utils/systemMessagesApi';

interface SystemMessageProps {
  message: SystemMessageType;
  onClose?: () => void;
  className?: string;
}

const SystemMessage: React.FC<SystemMessageProps> = ({ 
  message, 
  onClose,
  className = ''
}) => {
  // Define styles based on message type
  const getTypeStyles = () => {
    switch (message.message_type) {
      case 'info':
        return {
          containerClass: 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
          iconClass: 'text-blue-500 dark:text-blue-400',
          icon: <Info className="h-5 w-5" />
        };
      case 'warning':
        return {
          containerClass: 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
          iconClass: 'text-yellow-500 dark:text-yellow-400',
          icon: <AlertTriangle className="h-5 w-5" />
        };
      case 'success':
        return {
          containerClass: 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
          iconClass: 'text-green-500 dark:text-green-400',
          icon: <CheckCircle className="h-5 w-5" />
        };
      case 'error':
        return {
          containerClass: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
          iconClass: 'text-red-500 dark:text-red-400',
          icon: <XCircle className="h-5 w-5" />
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-200',
          iconClass: 'text-gray-500 dark:text-gray-400',
          icon: <Info className="h-5 w-5" />
        };
    }
  };

  const { containerClass, iconClass, icon } = getTypeStyles();

  return (
    <div className={`rounded-md border p-4 mb-4 relative ${containerClass} ${className}`} role="alert">
      <div className="flex">
        <div className={`flex-shrink-0 ${iconClass}`}>
          {icon}
        </div>
        <div className="ml-3 flex-1">
          {message.title && (
            <h3 className="text-sm font-medium">{message.title}</h3>
          )}
          <div className={`text-sm ${message.title ? 'mt-2' : ''}`}>
            {message.message}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SystemMessage;
