import { useCookieConsent } from '@/context/CookieConsentContext';
import CookieConsent from './CookieConsent';

const CookieConsentWrapper = () => {
  const { acceptCookies, declineCookies } = useCookieConsent();
  
  return (
    <CookieConsent 
      onAccept={acceptCookies} 
      onDecline={declineCookies} 
    />
  );
};

export default CookieConsentWrapper;
