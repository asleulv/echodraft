import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as analytics from '@/utils/analytics';

interface CookieConsentContextType {
  hasConsented: boolean | null;
  acceptCookies: () => void;
  declineCookies: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType>({
  hasConsented: null,
  acceptCookies: () => {},
  declineCookies: () => {},
});

export const useCookieConsent = () => useContext(CookieConsentContext);

interface CookieConsentProviderProps {
  children: ReactNode;
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({ children }) => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('cookie-consent-status');
    
    if (consentStatus === 'accepted') {
      setHasConsented(true);
      // Initialize analytics if consent was previously given
      analytics.initGA();
    } else if (consentStatus === 'declined') {
      setHasConsented(false);
    } else {
      setHasConsented(null);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent-status', 'accepted');
    setHasConsented(true);
    analytics.initGA();
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent-status', 'declined');
    setHasConsented(false);
    // Optionally, you could add code here to remove any existing cookies
  };

  return (
    <CookieConsentContext.Provider value={{ hasConsented, acceptCookies, declineCookies }}>
      {children}
    </CookieConsentContext.Provider>
  );
};
