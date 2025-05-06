import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsent = ({ onAccept, onDecline }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('cookie-consent-status');
    
    // Only show the banner if no choice has been made yet
    if (!consentStatus) {
      // Slight delay to prevent banner from showing immediately on page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent-status', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent-status', 'declined');
    setIsVisible(false);
    onDecline();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary-50 dark:bg-primary-100 shadow-lg z-50 border-t border-primary-200 dark:border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex-1 mb-4 sm:mb-0 sm:mr-8">
            <h3 className="text-lg font-medium text-primary-900">Cookie Consent</h3>
            <p className="mt-1 text-sm text-primary-600">
              We use cookies and Google Analytics to analyze site usage and improve your experience. 
              By accepting, you consent to the use of Google Analytics tracking (G-7D9TCG1MSV).
              See our <Link href="/privacy" className="text-secondary-600 underline hover:text-primary-800">Privacy Policy</Link> for more information.
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleDecline}
              className="px-4 py-2 border border-primary-300 dark:border-primary-600 rounded-md text-primary-700 bg-white dark:bg-primary-200 hover:bg-primary-50 dark:hover:bg-primary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-primary-800 bg-secondary-300 hover:bg-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
