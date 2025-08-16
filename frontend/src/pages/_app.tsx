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
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import * as analytics from '@/utils/analytics';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Track page views when the route changes (only if consent has been given)
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const consentStatus = localStorage.getItem('cookie-consent-status');
      if (consentStatus === 'accepted') {
        analytics.pageview(url);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''}
    >
      {/* Google Ads Script */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-16666637377"
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-16666637377');
        `}
      </Script>

      {/* Theme + Stripe redirect handling before hydration */}
      <Script id="theme-and-auth-init" strategy="beforeInteractive">
        {`
          (function() {
            try {
              // Apply theme immediately
              var storedTheme = localStorage.getItem('theme');
              if (storedTheme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }

              // Handle Stripe redirect persistence
              var url = window.location.href;
              if (url.includes('subscription') &&
                 (url.includes('success=true') || url.includes('canceled=true'))) {
                var token = localStorage.getItem('token');
                var refreshToken = localStorage.getItem('refreshToken');
                if (token && refreshToken) {
                  console.log('Stripe redirect: tokens found, AuthProvider will refresh.');
                }
              }
            } catch (e) {
              console.warn('Theme/Auth init script failed', e);
            }
          })();
        `}
      </Script>

      <AuthProvider>
        <ThemeProvider>
          <CookieConsentProvider>
            <main className={`${inter.variable} font-sans`}>
              <Component {...pageProps} />
              <CookieConsentWrapper />
            </main>
          </CookieConsentProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
