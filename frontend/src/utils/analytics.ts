// Google Analytics utility functions

// Initialize Google Analytics
export const initGA = (): void => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
    // Use the hardcoded measurement ID provided by Google
    const measurementId = 'G-7D9TCG1MSV';
    
    // Add Google Analytics script to the page
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_path: window.location.pathname,
      anonymize_ip: true
    });

    console.log('Google Analytics initialized with ID: G-7D9TCG1MSV');
  }
};

// Track page views
export const pageview = (url: string): void => {
  if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
    window.gtag('config', 'G-7D9TCG1MSV', {
      page_path: url,
      anonymize_ip: true
    });
  }
};

// Track events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}): void => {
  if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      send_to: 'G-7D9TCG1MSV'
    });
  }
};

// Declare global window interface
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
