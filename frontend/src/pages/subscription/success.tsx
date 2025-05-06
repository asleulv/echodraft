import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to restore session and redirect
    const restoreSessionAndRedirect = async () => {
      try {
        console.log('SubscriptionSuccessPage: Attempting to restore session');
        setIsLoading(true);

        // Check if we're authenticated
        if (isAuthenticated) {
          console.log('SubscriptionSuccessPage: User is authenticated, refreshing profile');
          await refreshUser();
          console.log('SubscriptionSuccessPage: User profile refreshed successfully');
        } else {
          console.log('SubscriptionSuccessPage: User is not authenticated, checking for tokens');
          
          // Check if we have tokens in localStorage
          const token = localStorage.getItem('token');
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (token && refreshToken) {
            console.log('SubscriptionSuccessPage: Found authentication tokens, attempting to restore session');
            
            // Wait a moment for the auth context to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              await refreshUser();
              console.log('SubscriptionSuccessPage: User profile restored successfully');
            } catch (err) {
              console.error('SubscriptionSuccessPage: Error restoring user profile:', err);
              setError('Failed to restore your session. Please try logging in again.');
              return;
            }
          } else {
            console.log('SubscriptionSuccessPage: No authentication tokens found');
            setError('Your session has expired. Please log in again.');
            
            // Redirect to login after a short delay
            setTimeout(() => {
              router.push('/login');
            }, 3000);
            return;
          }
        }

        // Clean up any subscription-related localStorage items to prevent API flooding
        localStorage.removeItem('subscription_upgrade_state');
        localStorage.removeItem('subscription_manage_state');
        
        // Redirect to the subscription page after a short delay
        // Add a timestamp to prevent caching issues
        setTimeout(() => {
          router.push(`/subscription?t=${Date.now()}`);
        }, 1500);
      } catch (err) {
        console.error('SubscriptionSuccessPage: Unexpected error:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only run this effect once when the component mounts
    const hasRun = localStorage.getItem('subscription_success_redirect_run');
    if (!hasRun) {
      localStorage.setItem('subscription_success_redirect_run', 'true');
      restoreSessionAndRedirect();
    }
    
    // Cleanup function to remove the flag when the component unmounts
    return () => {
      localStorage.removeItem('subscription_success_redirect_run');
    };
  }, [isAuthenticated, refreshUser, router]);

  return (
    <Layout title="Subscription Updated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-green-800 border border-green-200 px-4 py-3 rounded mb-6">
          <p className="font-bold text-white">Success!</p>
          <p className='text-white'>Your subscription has been updated successfully.</p>
        </div>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-primary-600">Redirecting you to your subscription details...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
