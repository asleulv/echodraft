import '@/styles/globals.css';
import '@/styles/markdown-editor.css';
import '@/styles/tiptap-editor.css';
import '@/styles/mobile-overrides.css'; // Mobile-specific overrides
import 'react-markdown-editor-lite/lib/index.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import CookieConsentWrapper from '@/components/CookieConsentWrapper';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as analytics from '@/utils/analytics';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Add script to prevent flash of incorrect theme, handle authentication persistence, and initialize analytics
  useEffect(() => {
    // This script runs once on client-side after hydration
    const setInitialTheme = () => {
      // Check if we already added the theme script
      if (document.getElementById('theme-script')) return;
      
      // Create a script element to run before React hydration
      const themeScript = document.createElement('script');
      themeScript.id = 'theme-script';
      themeScript.innerHTML = `
        (function() {
          // Immediately try to get the theme from localStorage
          var storedTheme = localStorage.getItem('theme');
          
          // Apply theme class to document
          if (storedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        })();
      `;
      
      // Add script to head
      document.head.appendChild(themeScript);
    };
    
    setInitialTheme();
    
    // Handle authentication persistence for Stripe redirects
    const handleAuthPersistence = () => {
      // Check if we're returning from a Stripe redirect
      const url = window.location.href;
      if (url.includes('subscription') && (url.includes('success=true') || url.includes('canceled=true'))) {
        console.log('Detected return from Stripe redirect, ensuring authentication persistence');
        
        // Force a refresh of the auth token if it exists
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (token && refreshToken) {
          console.log('Authentication tokens found, refreshing authentication state');
          
          // We don't need to do anything else here, as the AuthProvider will handle
          // refreshing the token and user profile on mount
        }
      }
    };
    
    handleAuthPersistence();

    // Google Analytics initialization is now handled by CookieConsentProvider
  }, []);

  // Track page views when the route changes (only if user has consented)
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Only track page views if consent has been given
      const consentStatus = localStorage.getItem('cookie-consent-status');
      if (consentStatus === 'accepted') {
        // Use the updated analytics function with hardcoded Google Analytics ID
        analytics.pageview(url);
      }
    };

    // When the component is mounted, subscribe to router changes
    router.events.on('routeChangeComplete', handleRouteChange);

    // If the component is unmounted, unsubscribe from the event
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);
  
  return (
    <AuthProvider>
      <Head>
        {/* Inline script to prevent flash of incorrect theme and handle authentication persistence */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Immediately try to get the theme from localStorage
                var storedTheme = localStorage.getItem('theme');
                
                // Apply theme class to document
                if (storedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                
                // Handle authentication persistence for Stripe redirects
                var url = window.location.href;
                if (url.includes('subscription') && (url.includes('success=true') || url.includes('canceled=true'))) {
                  console.log('Detected return from Stripe redirect in inline script, ensuring authentication persistence');
                  
                  // Force a refresh of the auth token if it exists
                  var token = localStorage.getItem('token');
                  var refreshToken = localStorage.getItem('refreshToken');
                  
                  if (token && refreshToken) {
                    console.log('Authentication tokens found in inline script');
                    
                    // We don't need to do anything else here, as the AuthProvider will handle
                    // refreshing the token and user profile on mount
                  }
                }
              })();
            `
          }}
        />
      </Head>
      <ThemeProvider>
        <CookieConsentProvider>
          <main className={`${inter.variable} font-sans`}>
            <Component {...pageProps} />
            <CookieConsentWrapper />
          </main>
        </CookieConsentProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
