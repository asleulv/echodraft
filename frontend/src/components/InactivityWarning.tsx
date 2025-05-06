import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const InactivityWarning = () => {
  const { showInactivityWarning, resetInactivityTimer } = useAuth();
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  
  useEffect(() => {
    if (!showInactivityWarning) {
      setTimeLeft(120);
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showInactivityWarning]);
  
  // Handle user activity in the warning dialog
  const handleStayLoggedIn = () => {
    console.log('User clicked "Stay Logged In" button');
    if (resetInactivityTimer) {
      resetInactivityTimer();
    }
  };
  
  if (!showInactivityWarning) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-primary-100 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-primary-900 dark:text-primary-200">Session Timeout Warning</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-primary-400">
          Your session will expire in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} due to inactivity.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-primary"
            onClick={handleStayLoggedIn}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning;
